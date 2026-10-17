"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { FiEye, FiEyeOff, FiLock, FiX } from 'react-icons/fi';
import { loadDailyAuraSheet, rememberManageGroup, redoDailyAuraOperation, saveDailyAuraOperations, undoDailyAuraOperations, type DailyAuraValue } from '@/actions/manage-aura';

import type { AuraCategory } from '@/types/types';
import { useManage, type SelectionState } from '@/hooks/useManage';
import { useT } from '@/lib/i18n/use-t';
import { categoryLabelKey } from '@/lib/aura-stats-shared';
import { categories } from './manage/constants';
import { ManageGridRows } from './manage/ManageGridRows';
import type { ManageGroup as Group, ManageStudent as Student } from './manage/types';
import { ManageExportControls } from './manage/ManageExportControls';
import {
    COLUMN_DEFAULTS_STORAGE_KEY,
    getHideAbsentPreferenceSnapshot,
    getShowZeroPreferenceSnapshot,
    loadColumnDefaults,
    saveHideAbsentPreference,
    saveShowZeroPreference,
    subscribeToHideAbsentPreference,
    subscribeToShowZeroPreference,
} from './manage/preferences';
import { ScoringRulebook } from './manage/ScoringRulebook';
type AuraHistoryEntry = {
    cells: Array<{ flatIndex: number; previous: number; next: number }>;
    persisted: Promise<boolean>;
};
type AuraRevisionCell = DailyAuraValue & { key: string; version: number; flatIndex: number };
type PendingAuraOperation = {
    groupId: number;
    lessonDate: string;
    changes: DailyAuraValue[];
    cells: AuraRevisionCell[];
    historyEntry: AuraHistoryEntry;
    resolve: (saved: boolean) => void;
};
type AuraActionHighlight = { action: 'undo' | 'redo'; cells: ReadonlySet<number> };

type InitialAuraSheet = { groupId: number; lessonDate: string; values: DailyAuraValue[] };
interface ManageProps {
    allStudents: Student[];
    allGroups: Group[];
    initialLessonDate: string;
    groupPreferenceKey?: string;
    hideAbsentPreferenceKey?: string;
    initialGroupId?: number;
    initialSheet?: InitialAuraSheet | null;
}

const buildAuraMap = (groupStudents: Student[], values: DailyAuraValue[]) => {
    const studentIndexes = new Map(groupStudents.map((student, index) => [student.id, index]));
    // Start every cell at 0; server values fill in what was actually scored.
    const auraMap: number[] = Array(groupStudents.length * categories.length).fill(0);
    for (const value of values) {
        const studentIndex = studentIndexes.get(value.studentId);
        const categoryIndex = categories.indexOf(value.category);
        if (studentIndex === undefined || categoryIndex < 0) continue;
        auraMap[studentIndex * categories.length + categoryIndex] = value.aura;
    }
    return auraMap;
};

export const Manage = ({ allStudents, allGroups, initialLessonDate, groupPreferenceKey, hideAbsentPreferenceKey, initialGroupId, initialSheet }: ManageProps) => {
    const t = useT();
    const categoryLabels = useMemo(() => ({
        attendance: t(categoryLabelKey('attendance')),
        camera: t(categoryLabelKey('camera')),
        activity: t(categoryLabelKey('activity')),
        qa: t(categoryLabelKey('qa')),
        classwork: t(categoryLabelKey('classwork')),
        workout: t(categoryLabelKey('workout')),
    }), [t]);
    const unnamedStudentLabel = t('manage.fallback.unnamedStudent');
    const studentLabel = t('manage.fallback.student');
    const groupLabel = t('manage.common.group');
    const groupsLabel = t('manage.common.groups');

    const [lessonDate, setLessonDate] = useState(initialLessonDate);
    const defaultGroupId = allGroups.find((group) => allStudents.some((student) => student.groupId === group.id))?.id
        ?? allGroups[0]?.id
        ?? null;
    const [activeGroupId, setActiveGroupId] = useState<number | null>(() =>
        initialGroupId ?? defaultGroupId,
    );
    // Only reload the sheet when roster content changes, not when its array identity does.
    const rosterKey = useMemo(
        () => allStudents.map((student) => `${student.id}:${student.groupId}:${student.displayName ?? ''}`).join('|'),
        [allStudents],
    );
    // Server-preloaded sheet for the first render, so scores are never painted as zeros first.
    const [initialAuraMap] = useState<number[] | null>(() => {
        if (!initialSheet || initialSheet.groupId !== activeGroupId || initialSheet.lessonDate !== initialLessonDate) return null;
        return buildAuraMap(allStudents.filter((student) => student.groupId === activeGroupId), initialSheet.values);
    });
    const preloadedSheetKeyRef = useRef<string | null>(
        initialAuraMap ? `${activeGroupId}|${lessonDate}|${rosterKey}` : null,
    ); const showZeroStorageKey = hideAbsentPreferenceKey ?? 'gigsona_manage_show_zero_scores_anonymous';
    const subscribeToHideAbsent = useCallback(
        (onChange: () => void) => subscribeToHideAbsentPreference(hideAbsentPreferenceKey, onChange),
        [hideAbsentPreferenceKey],
    );
    const readHideAbsent = useCallback(
        () => getHideAbsentPreferenceSnapshot(hideAbsentPreferenceKey),
        [hideAbsentPreferenceKey],
    );
    const hideAbsent = useSyncExternalStore(subscribeToHideAbsent, readHideAbsent, () => false);
    const subscribeToShowZeroPreferenceCallback = useCallback(
        (onChange: () => void) => subscribeToShowZeroPreference(showZeroStorageKey, onChange),
        [showZeroStorageKey],
    );
    const readShowZeroPreference = useCallback(
        () => getShowZeroPreferenceSnapshot(showZeroStorageKey),
        [showZeroStorageKey],
    );
    const showZeroScores = useSyncExternalStore(subscribeToShowZeroPreferenceCallback, readShowZeroPreference, () => false);
    const [columnDefaults, setColumnDefaults] = useState<Record<AuraCategory, number>>(loadColumnDefaults);
    const [lockedCategoryIndexes, setLockedCategoryIndexes] = useState<number[]>([]);
    const columnDefaultsRef = useRef(columnDefaults);
    const [saveState, setSaveState] = useState<'loading' | 'saved' | 'saving' | 'error'>(() => initialAuraMap ? 'saved' : 'loading');
    const [saveMessage, setSaveMessage] = useState('');
    const [editingCell, setEditingCell] = useState<number | null>(null);
    const [editingAura, setEditingAura] = useState('');
    const [nameSearchStatus, setNameSearchStatus] = useState('');
    const [actionHighlight, setActionHighlight] = useState<AuraActionHighlight | null>(null);
    const saveInFlightRef = useRef(false);
    const pendingWritesRef = useRef(0);
    const pendingUndoCountRef = useRef(0);
    const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
    const pendingAuraOperationsRef = useRef<PendingAuraOperation[]>([]);
    const saveBatchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cellVersionsRef = useRef(new Map<string, number>());
    const failedCellKeysRef = useRef(new Set<string>());
    const auraMapRef = useRef<number[]>(initialAuraMap ?? []);
    const savedAuraMapRef = useRef<number[]>(initialAuraMap ? [...initialAuraMap] : []);
    const sheetReadyRef = useRef(initialAuraMap !== null);
    const saveErrorRef = useRef(false);
    const applyAuraRef = useRef<(indexes: number[], direction?: 1 | -1) => void>(() => undefined);
    const undoAuraRef = useRef<() => void>(() => undefined);
    const redoAuraRef = useRef<() => void>(() => undefined);
    const matrixCellsRef = useRef<Array<HTMLDivElement | null>>([]);
    const selectionHistoryRef = useRef<SelectionState[][]>([]);
    const namePrefixRef = useRef('');
    const namePrefixTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const columnSelectionRowsRef = useRef<number[] | null>(null);
    const cursorRef = useRef(0);
    const operationHistoryRef = useRef<AuraHistoryEntry[]>([]);
    const redoHistoryRef = useRef<Array<AuraHistoryEntry | null>>([]);
    const redoGenerationRef = useRef(0);
    const pendingRedoCountRef = useRef(0);
    const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeGroup = allGroups.find((group) => group.id === activeGroupId) ?? null;
    const chosenGroupStudents = useMemo(
        () => allStudents.filter((student) => student.groupId === activeGroupId),
        [allStudents, activeGroupId],
    );

    const { auraMap, setAuraMap, selectionMap, setSelectionMap } = useManage({
        categoriesCount: categories.length,
        studentsCount: chosenGroupStudents.length,
        initialAuraMap: initialAuraMap ?? undefined,
    });
    const attendanceCategoryIndex = categories.indexOf('attendance');
    const isStudentHidden = useCallback((studentIndex: number) =>
        hideAbsent
        && saveState !== 'loading'
        && saveState !== 'error'
        && (auraMap[studentIndex * categories.length + attendanceCategoryIndex] ?? 0) === 0,
        [auraMap, attendanceCategoryIndex, hideAbsent, saveState]);
    const visibleStudentIndexes = useMemo(() => chosenGroupStudents.flatMap((_, studentIndex) =>
        isStudentHidden(studentIndex) ? [] : [studentIndex],
    ), [chosenGroupStudents, isStudentHidden]);
    const selectedCellCount = selectionMap.filter((state, flatIndex) =>
        state === 'selected' && !isStudentHidden(Math.floor(flatIndex / categories.length)),
    ).length;
    const selectionMapRef = useRef(selectionMap);

    useEffect(() => {
        selectionMapRef.current = selectionMap;
    }, [selectionMap]);

    // Persist column defaults to localStorage and keep ref in sync.
    useEffect(() => {
        columnDefaultsRef.current = columnDefaults;
        try {
            localStorage.setItem(COLUMN_DEFAULTS_STORAGE_KEY, JSON.stringify(columnDefaults));
        } catch { /* storage full or unavailable — silently ignore */ }
    }, [columnDefaults]);

    const setSelectionWithHistory = useCallback((nextSelection: SelectionState[]) => {
        selectionHistoryRef.current.push([...selectionMapRef.current]);
        if (selectionHistoryRef.current.length > 50) selectionHistoryRef.current.shift();
        const allowedSelection = nextSelection.map((state, flatIndex) =>
            isStudentHidden(Math.floor(flatIndex / categories.length)) ? 'deselected' : state,
        );
        selectionMapRef.current = allowedSelection;
        setSelectionMap(allowedSelection);
    }, [isStudentHidden, setSelectionMap]);

    const undoSelection = useCallback(() => {
        const previousSelection = selectionHistoryRef.current.pop();
        if (previousSelection) {
            const allowedSelection = previousSelection.map((state, flatIndex) =>
                isStudentHidden(Math.floor(flatIndex / categories.length)) ? 'deselected' : state,
            );
            selectionMapRef.current = allowedSelection;
            setSelectionMap(allowedSelection);
        }
    }, [isStudentHidden, setSelectionMap]);

    useEffect(() => {
        if (!hideAbsent || saveState === 'loading' || saveState === 'error') return;
        const nextSelection = [...selectionMapRef.current];
        let changed = false;
        chosenGroupStudents.forEach((_, studentIndex) => {
            if (!isStudentHidden(studentIndex)) return;
            for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
                const flatIndex = studentIndex * categories.length + categoryIndex;
                if (nextSelection[flatIndex] === 'selected') {
                    nextSelection[flatIndex] = 'deselected';
                    changed = true;
                }
            }
        });
        if (changed) setSelectionWithHistory(nextSelection);
    }, [chosenGroupStudents, hideAbsent, isStudentHidden, saveState, setSelectionWithHistory]);

    const clearActionHighlight = useCallback(() => {
        if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current);
            highlightTimeoutRef.current = null;
        }
        setActionHighlight(null);
    }, []);

    const flashAuraActionCells = useCallback((action: AuraActionHighlight['action'], indexes: number[]) => {
        if (indexes.length === 0) return;
        if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
        setActionHighlight({ action, cells: new Set(indexes) });
        highlightTimeoutRef.current = setTimeout(() => {
            highlightTimeoutRef.current = null;
            setActionHighlight(null);
        }, 300);
    }, []);

    useEffect(() => () => {
        if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    }, []);

    useEffect(() => {
        const clearPrefix = () => {
            namePrefixRef.current = '';
            setNameSearchStatus('');
            if (namePrefixTimeoutRef.current) clearTimeout(namePrefixTimeoutRef.current);
            namePrefixTimeoutRef.current = null;
        };

        const handleGridKeyboard = (event: KeyboardEvent) => {
            const target = event.target;
            const isColumnShortcut = !event.defaultPrevented
                && !event.altKey
                && !event.ctrlKey
                && !event.metaKey
                && /^[1-6]$/.test(event.key);
            const isPlainEscapeShortcut = event.key === 'Escape'
                && !event.altKey
                && !event.ctrlKey
                && !event.metaKey;
            if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) {
                columnSelectionRowsRef.current = null;
                return;
            }
            if (!event.defaultPrevented && event.altKey && !event.ctrlKey && !event.metaKey
                && (event.key === 'Backspace' || event.key === 'Delete')) {
                event.preventDefault();
                clearPrefix();
                return;
            }
            const isLetter = !event.defaultPrevented && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey && event.key.length === 1 && /^\p{L}$/u.test(event.key);
            if (target instanceof HTMLElement) {
                const interactiveTarget = target.closest('button, a, [role="button"], [role="menuitem"]');
                const isScoreShortcut = event.code === 'Space' || event.key === ' '
                    || event.key === 'Delete' || event.key === 'Backspace';
                const isUndoRedoShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z';
                const isSelectionControl = interactiveTarget?.hasAttribute('data-manage-selection-control');
                if (interactiveTarget
                    && !interactiveTarget.hasAttribute('data-manage-cell')
                    && !(isSelectionControl && (isScoreShortcut || isUndoRedoShortcut || isColumnShortcut || isPlainEscapeShortcut))
                    && !(isLetter && target.closest('[data-manage-page]'))) {
                    columnSelectionRowsRef.current = null;
                    return;
                }
            }
            if (document.body.style.overflow === 'hidden') {
                columnSelectionRowsRef.current = null;
                return;
            }

            if (!isColumnShortcut) columnSelectionRowsRef.current = null;
            if (isColumnShortcut) {
                event.preventDefault();
                if (event.repeat || !sheetReadyRef.current || activeGroupId === null) return;
                const startsSequence = columnSelectionRowsRef.current === null;
                const selectedRows = columnSelectionRowsRef.current ?? chosenGroupStudents.flatMap((_, studentIndex) =>
                    !isStudentHidden(studentIndex)
                        && selectionMapRef.current
                            .slice(studentIndex * categories.length, (studentIndex + 1) * categories.length)
                            .some((state) => state === 'selected')
                        ? [studentIndex]
                        : [],
                );
                if (selectedRows.length === 0) return;
                columnSelectionRowsRef.current = selectedRows;

                const categoryIndex = Number(event.key) - 1;
                const nextSelection = [...selectionMapRef.current];
                selectedRows.forEach((studentIndex) => {
                    const rowStart = studentIndex * categories.length;
                    if (startsSequence) {
                        for (let index = 0; index < categories.length; index += 1) {
                            nextSelection[rowStart + index] = index === categoryIndex ? 'selected' : 'deselected';
                        }
                    } else {
                        const flatIndex = rowStart + categoryIndex;
                        nextSelection[flatIndex] = nextSelection[flatIndex] === 'selected' ? 'deselected' : 'selected';
                    }
                });
                const firstCellIndex = selectedRows[0] * categories.length + categoryIndex;
                cursorRef.current = firstCellIndex;
                setSelectionWithHistory(nextSelection);
                matrixCellsRef.current[firstCellIndex]?.focus();
                return;
            }

            // Type-to-find: printable letters accumulate a name prefix.
            // Type-to-find: printable letters accumulate a name prefix.
            if (isLetter) {
                if (!sheetReadyRef.current || activeGroupId === null) return;
                const prefix = `${namePrefixRef.current}${event.key.toLocaleLowerCase()}`;
                namePrefixRef.current = prefix;
                const groupStudents = allStudents.filter((student) => student.groupId === activeGroupId);
                const matchingRows = groupStudents.flatMap((student, index) =>
                    !isStudentHidden(index) && student.displayName?.toLocaleLowerCase().startsWith(prefix) ? [index] : [],
                );

                if (matchingRows.length === 0) {
                    setNameSearchStatus(t('manage.search.noNamesStart', { prefix }));
                } else {
                    const nextSelection = Array(groupStudents.length * categories.length).fill('deselected') as SelectionState[];
                    const categoryIndexes = lockedCategoryIndexes.length > 0
                        ? lockedCategoryIndexes
                        : categories.map((_, index) => index);
                    for (const rowIndex of matchingRows) {
                        for (const categoryIndex of categoryIndexes) {
                            nextSelection[rowIndex * categories.length + categoryIndex] = 'selected';
                        }
                    }
                    setSelectionWithHistory(nextSelection);
                    const firstCellIndex = matchingRows[0] * categories.length + categoryIndexes[0];
                    cursorRef.current = firstCellIndex;
                    matrixCellsRef.current[firstCellIndex]?.focus();
                    setNameSearchStatus(matchingRows.length === 1
                        ? t('manage.search.match.one', { count: matchingRows.length, prefix })
                        : t('manage.search.match.other', { count: matchingRows.length, prefix }));
                }

                if (namePrefixTimeoutRef.current) clearTimeout(namePrefixTimeoutRef.current);
                namePrefixTimeoutRef.current = setTimeout(clearPrefix, 1400);
                return;
            }

            // Space adds the per-column default; Delete subtracts it.
            const isSpace = event.code === 'Space' || event.key === ' ';
            const isDelete = event.key === 'Delete' || event.key === 'Backspace';
            if (isSpace || isDelete) {
                if (event.repeat) return;
                const selectedIndexes = selectionMapRef.current.flatMap((state, index) =>
                    state === 'selected' && !isStudentHidden(Math.floor(index / categories.length)) ? [index] : [],
                );
                if (selectedIndexes.length === 0) return;
                event.preventDefault();
                void applyAuraRef.current(selectedIndexes, isSpace ? 1 : -1);
                return;
            }

            // Selection shortcuts.
            if (event.altKey && event.code === 'KeyA') {
                event.preventDefault();
                const nextSelection = Array(selectionMapRef.current.length).fill('deselected') as SelectionState[];
                visibleStudentIndexes.forEach((studentIndex) => {
                    for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
                        nextSelection[studentIndex * categories.length + categoryIndex] = 'selected';
                    }
                });
                setSelectionWithHistory(nextSelection);
                return;
            }
            if (event.altKey && event.code === 'KeyB') {
                event.preventDefault();
                const nextSelection = [...selectionMapRef.current];
                visibleStudentIndexes.forEach((studentIndex) => {
                    for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
                        const flatIndex = studentIndex * categories.length + categoryIndex;
                        nextSelection[flatIndex] = nextSelection[flatIndex] === 'selected' ? 'deselected' : 'selected';
                    }
                });
                setSelectionWithHistory(nextSelection);
                return;
            }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
                event.preventDefault();
                if (event.shiftKey) redoAuraRef.current();
                else undoAuraRef.current();
                return;
            }
            if (isPlainEscapeShortcut) {
                event.preventDefault();
                undoSelection();
                return;
            }

            if (!sheetReadyRef.current || activeGroupId === null) return;
            const groupStudents = allStudents.filter((student) => student.groupId === activeGroupId);
            if (visibleStudentIndexes.length === 0) return;
            const totalCells = groupStudents.length * categories.length;
            if (cursorRef.current < 0 || cursorRef.current >= totalCells) cursorRef.current = 0;
            const flatIndex = cursorRef.current;

            if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
                event.preventDefault();
                event.stopPropagation();
                const studentIndex = Math.floor(flatIndex / categories.length);
                const categoryIndex = flatIndex % categories.length;
                const visibleRowIndex = visibleStudentIndexes.indexOf(studentIndex);
                const currentVisibleRowIndex = visibleRowIndex < 0 ? 0 : visibleRowIndex;
                const nextCategory = event.key === 'ArrowRight'
                    ? (categoryIndex + 1) % categories.length
                    : event.key === 'ArrowLeft'
                        ? (categoryIndex - 1 + categories.length) % categories.length
                        : categoryIndex;
                const nextVisibleRowIndex = event.key === 'ArrowDown'
                    ? (currentVisibleRowIndex + 1) % visibleStudentIndexes.length
                    : event.key === 'ArrowUp'
                        ? (currentVisibleRowIndex - 1 + visibleStudentIndexes.length) % visibleStudentIndexes.length
                        : currentVisibleRowIndex;
                const nextStudent = visibleStudentIndexes[nextVisibleRowIndex];
                const nextIndex = nextStudent * categories.length + nextCategory;
                cursorRef.current = nextIndex;
                matrixCellsRef.current[nextIndex]?.focus();
                const nextSelection = Array(selectionMapRef.current.length).fill('deselected');
                nextSelection[nextIndex] = 'selected';
                setSelectionWithHistory(nextSelection);
                return;
            }

            if (event.key === 'F2') {
                event.preventDefault();
                if (isStudentHidden(Math.floor(flatIndex / categories.length))) return;
                setSelectionWithHistory(Array(selectionMapRef.current.length).fill('deselected'));
                setEditingCell(flatIndex);
                setEditingAura(String(auraMapRef.current[flatIndex] ?? 0));
                return;
            }

        };

        const resetColumnSelectionSequence = () => {
            columnSelectionRowsRef.current = null;
        };
        window.addEventListener('pointerdown', resetColumnSelectionSequence);
        window.addEventListener('keydown', handleGridKeyboard);
        return () => {
            window.removeEventListener('pointerdown', resetColumnSelectionSequence);
            window.removeEventListener('keydown', handleGridKeyboard);
            if (namePrefixTimeoutRef.current) clearTimeout(namePrefixTimeoutRef.current);
            resetColumnSelectionSequence();
        };
    }, [activeGroupId, allStudents, auraMap, chosenGroupStudents, hideAbsent, isStudentHidden, lockedCategoryIndexes, saveState, setSelectionMap, setSelectionWithHistory, t, undoSelection, visibleStudentIndexes]);

    useEffect(() => {
        let isCurrentRequest = true;

        if (activeGroupId === null) {
            sheetReadyRef.current = false;
            return;
        }

        const sheetKey = `${activeGroupId}|${lessonDate}|${rosterKey}`;
        if (preloadedSheetKeyRef.current === sheetKey) return;
        preloadedSheetKeyRef.current = null;

        sheetReadyRef.current = false;
        loadDailyAuraSheet({ groupId: activeGroupId, lessonDate }).then((result) => {
            if (!isCurrentRequest) return;
            if (!result.ok) {
                saveErrorRef.current = true;
                setSaveState('error');
                setSaveMessage(result.message);
                return;
            }

            const groupStudents = allStudents.filter((student) => student.groupId === activeGroupId);
            const nextAuraMap = buildAuraMap(groupStudents, result.values);

            auraMapRef.current = nextAuraMap;
            savedAuraMapRef.current = [...nextAuraMap];
            sheetReadyRef.current = true;
            saveErrorRef.current = false;
            failedCellKeysRef.current.clear();
            selectionHistoryRef.current = [];
            setAuraMap(nextAuraMap);
            setSaveState('saved');
        }).catch((error: unknown) => {
            if (!isCurrentRequest) return;
            sheetReadyRef.current = false;
            saveErrorRef.current = true;
            setSaveState('error');
            setSaveMessage(error instanceof Error ? error.message : t('manage.errors.loadDay'));
        });

        return () => { isCurrentRequest = false; };
        // Deliberately keyed on rosterKey instead of allStudents: revalidatePath
        // rebuilds the array identity after every save/undo and that must not
        // reload the whole sheet each time.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeGroupId, lessonDate, rosterKey, setAuraMap, t]);

    const flushPendingSaves = useCallback(() => {
        if (saveBatchTimeoutRef.current) {
            clearTimeout(saveBatchTimeoutRef.current);
            saveBatchTimeoutRef.current = null;
        }
        const pending = pendingAuraOperationsRef.current.splice(0);
        if (pending.length === 0) return;

        const { groupId, lessonDate: currentLessonDate } = pending[0];

        let saved = false;
        const request = writeQueueRef.current.then(async () => {
            const result = await saveDailyAuraOperations({
                groupId,
                lessonDate: currentLessonDate,
                operations: pending.map((operation) => operation.changes),
            });
            if (!result.ok) throw new Error(result.message);

            const confirmedMap = [...savedAuraMapRef.current];
            for (const operation of pending) {
                for (const cell of operation.cells) {
                    if (cellVersionsRef.current.get(cell.key) === cell.version) {
                        confirmedMap[cell.flatIndex] = cell.aura;
                        failedCellKeysRef.current.delete(cell.key);
                    }
                }
            }
            savedAuraMapRef.current = confirmedMap;
            saved = true;
        }).catch((error: unknown) => {
            const failedEntries = new Set(pending.map((operation) => operation.historyEntry));
            operationHistoryRef.current = operationHistoryRef.current.filter((entry) => !failedEntries.has(entry));
            const nextMapAfterRollback = [...auraMapRef.current];
            let rolledBackAny = false;
            for (const operation of pending) {
                for (const cell of operation.cells) {
                    if (cellVersionsRef.current.get(cell.key) !== cell.version) continue;
                    nextMapAfterRollback[cell.flatIndex] = savedAuraMapRef.current[cell.flatIndex] ?? 0;
                    failedCellKeysRef.current.add(cell.key);
                    rolledBackAny = true;
                }
            }
            if (rolledBackAny) {
                auraMapRef.current = nextMapAfterRollback;
                setAuraMap(nextMapAfterRollback);
            }
            saveErrorRef.current = true;
            setSaveState('error');
            setSaveMessage(error instanceof Error ? error.message : t('manage.errors.saveChanges'));
        }).finally(() => {
            pendingWritesRef.current -= pending.length;
            saveInFlightRef.current = pendingWritesRef.current > 0;
            if (pendingWritesRef.current === 0 && sheetReadyRef.current) {
                const hasError = saveErrorRef.current || failedCellKeysRef.current.size > 0;
                setSaveState(hasError ? 'error' : 'saved');
                if (!hasError) setSaveMessage('');
            }
            for (const operation of pending) operation.resolve(saved);
        });

        writeQueueRef.current = request.then(() => undefined, () => undefined);
    }, [setAuraMap, t]);

    const persistChanges = useCallback((changes: DailyAuraValue[], nextMap: number[]) => {
        if (activeGroupId === null || !sheetReadyRef.current || changes.length === 0) return Promise.resolve(false);

        const groupId = activeGroupId;
        const currentLessonDate = lessonDate;
        const groupStudents = allStudents.filter((student) => student.groupId === groupId);
        const studentIndexes = new Map(groupStudents.map((student, index) => [student.id, index]));
        const uniqueChanges = new Map(changes.map((change) => [`${change.studentId}:${change.category}`, change]));
        const revisionCells: AuraRevisionCell[] = Array.from(uniqueChanges.values()).flatMap((change) => {
            const studentIndex = studentIndexes.get(change.studentId);
            const categoryIndex = categories.indexOf(change.category);
            if (studentIndex === undefined || categoryIndex < 0) return [];
            const flatIndex = studentIndex * categories.length + categoryIndex;
            if ((auraMapRef.current[flatIndex] ?? 0) === change.aura) return [];
            const key = `${groupId}:${currentLessonDate}:${change.studentId}:${change.category}`;
            const version = (cellVersionsRef.current.get(key) ?? 0) + 1;
            cellVersionsRef.current.set(key, version);
            failedCellKeysRef.current.delete(key);
            return [{ ...change, key, version, flatIndex }];
        });

        if (revisionCells.length === 0) return Promise.resolve(false);

        let resolvePersistence: (saved: boolean) => void = () => undefined;
        const persisted = new Promise<boolean>((resolve) => { resolvePersistence = resolve; });
        const historyEntry: AuraHistoryEntry = {
            cells: revisionCells.map((cell) => ({
                flatIndex: cell.flatIndex,
                previous: auraMapRef.current[cell.flatIndex] ?? 0,
                next: cell.aura,
            })),
            persisted,
        };
        redoGenerationRef.current += 1;
        redoHistoryRef.current = [];
        operationHistoryRef.current.push(historyEntry);

        auraMapRef.current = [...nextMap];
        setAuraMap(nextMap);
        saveErrorRef.current = false;
        pendingWritesRef.current += 1;
        saveInFlightRef.current = true;
        setSaveState('saving');
        setSaveMessage('');

        pendingAuraOperationsRef.current.push({
            groupId,
            lessonDate: currentLessonDate,
            changes: revisionCells.map(({ studentId, category, aura }) => ({ studentId, category, aura })),
            cells: revisionCells,
            historyEntry,
            resolve: resolvePersistence,
        });
        const queuedCellCount = pendingAuraOperationsRef.current.reduce((count, operation) => count + operation.cells.length, 0);
        if (queuedCellCount >= 500 || pendingAuraOperationsRef.current.length >= 100) {
            flushPendingSaves();
        } else if (!saveBatchTimeoutRef.current) {
            saveBatchTimeoutRef.current = setTimeout(flushPendingSaves, 32);
        }

        return persisted;
    }, [activeGroupId, allStudents, flushPendingSaves, lessonDate, setAuraMap]);

    const applyAuraToIndexes = useCallback(async (indexes: number[], direction: 1 | -1 = 1) => {
        if (!sheetReadyRef.current) return;

        const groupStudents = allStudents.filter((student) => student.groupId === activeGroupId);
        const nextMap = [...auraMapRef.current];
        const changes: DailyAuraValue[] = [];

        for (const flatIndex of indexes) {
            const studentIndex = Math.floor(flatIndex / categories.length);
            const categoryIndex = flatIndex % categories.length;
            const student = groupStudents[studentIndex];
            const category = categories[categoryIndex];
            if (!student || !category) continue;

            const amount = columnDefaultsRef.current[category] * direction;

            if (!Number.isInteger(amount) || amount === 0) {
                saveErrorRef.current = true;
                setSaveState('error');
                setSaveMessage(t('manage.errors.columnDefaults'));
                return;
            }

            nextMap[flatIndex] = (nextMap[flatIndex] ?? 0) + amount;
            changes.push({ studentId: student.id, category, aura: nextMap[flatIndex] });
        }

        if (changes.length === 0) return;
        await persistChanges(changes, nextMap);
    }, [activeGroupId, allStudents, persistChanges, t]);


    useEffect(() => {
        applyAuraRef.current = (indexes, direction) => { void applyAuraToIndexes(indexes, direction); };
    }, [applyAuraToIndexes]);

    const queueUndoOperation = useCallback((entry: AuraHistoryEntry | null, versionsAtUndo: Map<string, number>) => {
        if (activeGroupId === null) return;

        const groupId = activeGroupId;
        const currentLessonDate = lessonDate;
        const studentIndexes = new Map(
            allStudents.filter((student) => student.groupId === groupId).map((student, index) => [student.id, index]),
        );
        const toFlatIndex = (value: DailyAuraValue) => {
            const studentIndex = studentIndexes.get(value.studentId);
            const categoryIndex = categories.indexOf(value.category);
            return studentIndex === undefined || categoryIndex < 0 ? null : studentIndex * categories.length + categoryIndex;
        };
        const restore = (historyEntry: AuraHistoryEntry | null) => {
            if (historyEntry) operationHistoryRef.current.push(historyEntry);
        };
        const preserveNewerOptimisticChanges = (confirmedMap: number[]) => {
            const displayedMap = [...confirmedMap];
            const groupStudents = allStudents.filter((student) => student.groupId === groupId);
            groupStudents.forEach((student, studentIndex) => {
                categories.forEach((category, categoryIndex) => {
                    const key = `${groupId}:${currentLessonDate}:${student.id}:${category}`;
                    if ((cellVersionsRef.current.get(key) ?? 0) <= (versionsAtUndo.get(key) ?? 0)) return;
                    const flatIndex = studentIndex * categories.length + categoryIndex;
                    displayedMap[flatIndex] = auraMapRef.current[flatIndex] ?? displayedMap[flatIndex] ?? 0;
                });
            });
            return displayedMap;
        };

        const task = writeQueueRef.current.then(async () => {
            try {
                const persisted = entry ? await entry.persisted : true;
                const undoable = persisted ? [entry] : [];
                const baseMap = [...savedAuraMapRef.current];
                if (undoable.length === 0) {
                    clearActionHighlight();
                    if (pendingUndoCountRef.current === 1 && pendingRedoCountRef.current === 0) {
                        const displayedMap = preserveNewerOptimisticChanges(baseMap);
                        auraMapRef.current = displayedMap;
                        setAuraMap(displayedMap);
                    }
                    return;
                }

                try {
                    const result = await undoDailyAuraOperations({ groupId, lessonDate: currentLessonDate, count: 1 });
                    if (!result.ok) {
                        restore(entry);
                        redoGenerationRef.current += 1;
                        const redoIndex = redoHistoryRef.current.lastIndexOf(entry);
                        if (redoIndex >= 0) redoHistoryRef.current.splice(redoIndex, 1);
                        clearActionHighlight();
                        if (pendingUndoCountRef.current === 1 && pendingRedoCountRef.current === 0) {
                            const displayedMap = preserveNewerOptimisticChanges(baseMap);
                            auraMapRef.current = displayedMap;
                            setAuraMap(displayedMap);
                        }
                        saveErrorRef.current = true;
                        setSaveState('error');
                        setSaveMessage(result.message);
                        return;
                    }

                    const nextAuraMap = [...baseMap];
                    for (const value of result.values) {
                        const flatIndex = toFlatIndex(value);
                        if (flatIndex !== null) nextAuraMap[flatIndex] = value.aura;
                    }
                    savedAuraMapRef.current = [...nextAuraMap];
                    failedCellKeysRef.current.clear();
                    if (pendingUndoCountRef.current === 1 && pendingRedoCountRef.current === 0) {
                        const displayedMap = preserveNewerOptimisticChanges(nextAuraMap);
                        auraMapRef.current = displayedMap;
                        setAuraMap(displayedMap);
                    }

                    if (result.undoneCount < 1) {
                        restore(entry);
                        redoGenerationRef.current += 1;
                        const redoIndex = redoHistoryRef.current.lastIndexOf(entry);
                        if (redoIndex >= 0) redoHistoryRef.current.splice(redoIndex, 1);
                        clearActionHighlight();
                        saveErrorRef.current = true;
                        setSaveState('error');
                        setSaveMessage(result.message || t('manage.errors.undoSomeActions'));
                        return;
                    }

                    saveErrorRef.current = false;
                    if (!entry) {
                        flashAuraActionCells('undo', result.values.flatMap((value) => {
                            const flatIndex = toFlatIndex(value);
                            return flatIndex === null ? [] : [flatIndex];
                        }));
                    }
                } catch (error) {
                    restore(entry);
                    redoGenerationRef.current += 1;
                    const redoIndex = redoHistoryRef.current.lastIndexOf(entry);
                    if (redoIndex >= 0) redoHistoryRef.current.splice(redoIndex, 1);
                    clearActionHighlight();
                    if (pendingUndoCountRef.current === 1 && pendingRedoCountRef.current === 0) {
                        const displayedMap = preserveNewerOptimisticChanges(baseMap);
                        auraMapRef.current = displayedMap;
                        setAuraMap(displayedMap);
                    }
                    saveErrorRef.current = true;
                    setSaveState('error');
                    setSaveMessage(error instanceof Error ? error.message : t('manage.errors.undoLastAction'));
                }
            } finally {
                pendingWritesRef.current -= 1;
                pendingUndoCountRef.current -= 1;
                saveInFlightRef.current = pendingWritesRef.current > 0;
                if (pendingWritesRef.current === 0 && sheetReadyRef.current) {
                    const hasError = saveErrorRef.current || failedCellKeysRef.current.size > 0;
                    setSaveState(hasError ? 'error' : 'saved');
                    if (!hasError) setSaveMessage('');
                }
            }
        });
        writeQueueRef.current = task.then(() => undefined, () => undefined);
    }, [activeGroupId, allStudents, lessonDate, setAuraMap, flashAuraActionCells, clearActionHighlight, t]);

    const undoAuraOperation = useCallback(() => {
        if (activeGroupId === null || !sheetReadyRef.current) return;

        // Pop synchronously so rapid presses each target the next older action.
        const op = operationHistoryRef.current.pop() ?? null;
        redoHistoryRef.current.push(op);
        const versionsAtUndo = new Map(cellVersionsRef.current);
        pendingWritesRef.current += 1;
        pendingUndoCountRef.current += 1;
        saveInFlightRef.current = true;
        setSaveState('saving');
        setSaveMessage('');

        // Optimistic revert so undo feels instant; the server response is the source of truth.
        if (op) {
            const optimisticMap = [...auraMapRef.current];
            for (const cell of op.cells) optimisticMap[cell.flatIndex] = cell.previous;
            auraMapRef.current = optimisticMap;
            setAuraMap(optimisticMap);
            flashAuraActionCells('undo', op.cells.map((cell) => cell.flatIndex));
        }

        flushPendingSaves();
        queueUndoOperation(op, versionsAtUndo);
    }, [activeGroupId, flashAuraActionCells, flushPendingSaves, queueUndoOperation, setAuraMap]);

    const queueRedoOperation = useCallback((
        entry: AuraHistoryEntry | null,
        hasRedoEntry: boolean,
        redoGenerationAtRequest: number,
        versionsAtRedo: Map<string, number>,
        optimisticHistoryEntry: AuraHistoryEntry | null,
        resolveRedo: (saved: boolean) => void,
    ) => {
        if (activeGroupId === null) return;

        const groupId = activeGroupId;
        const currentLessonDate = lessonDate;
        const groupStudents = allStudents.filter((student) => student.groupId === groupId);
        const studentIndexes = new Map(groupStudents.map((student, index) => [student.id, index]));
        const toFlatIndex = (value: DailyAuraValue) => {
            const studentIndex = studentIndexes.get(value.studentId);
            const categoryIndex = categories.indexOf(value.category);
            return studentIndex === undefined || categoryIndex < 0 ? null : studentIndex * categories.length + categoryIndex;
        };
        const preserveNewerOptimisticChanges = (confirmedMap: number[]) => {
            const displayedMap = [...confirmedMap];
            groupStudents.forEach((student, studentIndex) => {
                categories.forEach((category, categoryIndex) => {
                    const key = `${groupId}:${currentLessonDate}:${student.id}:${category}`;
                    if ((cellVersionsRef.current.get(key) ?? 0) <= (versionsAtRedo.get(key) ?? 0)) return;
                    const flatIndex = studentIndex * categories.length + categoryIndex;
                    displayedMap[flatIndex] = auraMapRef.current[flatIndex] ?? displayedMap[flatIndex] ?? 0;
                });
            });
            return displayedMap;
        };

        const task = writeQueueRef.current.then(async () => {
            try {
                const baseMap = [...savedAuraMapRef.current];
                const result = await redoDailyAuraOperation({ groupId, lessonDate: currentLessonDate });
                if (!result.ok) throw new Error(result.message);
                resolveRedo(true);

                const nextAuraMap = [...baseMap];
                const historyCells: AuraHistoryEntry['cells'] = [];
                for (const value of result.values) {
                    const flatIndex = toFlatIndex(value);
                    if (flatIndex === null) continue;
                    const previous = nextAuraMap[flatIndex] ?? 0;
                    nextAuraMap[flatIndex] = value.aura;
                    historyCells.push({ flatIndex, previous, next: value.aura });
                }

                savedAuraMapRef.current = [...nextAuraMap];
                if (!optimisticHistoryEntry && historyCells.length > 0) {
                    operationHistoryRef.current.push({
                        cells: historyCells,
                        persisted: Promise.resolve(true),
                    });
                }
                failedCellKeysRef.current.clear();
                saveErrorRef.current = false;
                if (pendingRedoCountRef.current === 1 && pendingUndoCountRef.current === 0) {
                    const displayedMap = preserveNewerOptimisticChanges(nextAuraMap);
                    auraMapRef.current = displayedMap;
                    setAuraMap(displayedMap);
                }
                if (!entry) flashAuraActionCells('redo', historyCells.map((cell) => cell.flatIndex));
            } catch (error) {
                resolveRedo(false);
                if (optimisticHistoryEntry) {
                    const operationIndex = operationHistoryRef.current.lastIndexOf(optimisticHistoryEntry);
                    if (operationIndex >= 0) operationHistoryRef.current.splice(operationIndex, 1);
                }
                if (hasRedoEntry && redoGenerationRef.current === redoGenerationAtRequest) {
                    redoHistoryRef.current.push(entry);
                }
                clearActionHighlight();
                if (pendingRedoCountRef.current === 1 && pendingUndoCountRef.current === 0) {
                    const baseMap = [...savedAuraMapRef.current];
                    const displayedMap = preserveNewerOptimisticChanges(baseMap);
                    auraMapRef.current = displayedMap;
                    setAuraMap(displayedMap);
                }
                saveErrorRef.current = true;
                setSaveState('error');
                setSaveMessage(error instanceof Error ? error.message : t('manage.errors.redoLastAction'));
            } finally {
                pendingWritesRef.current -= 1;
                pendingRedoCountRef.current -= 1;
                saveInFlightRef.current = pendingWritesRef.current > 0;
                if (pendingWritesRef.current === 0 && sheetReadyRef.current) {
                    const hasError = saveErrorRef.current || failedCellKeysRef.current.size > 0;
                    setSaveState(hasError ? 'error' : 'saved');
                    if (!hasError) setSaveMessage('');
                }
            }
        });
        writeQueueRef.current = task.then(() => undefined, () => undefined);
    }, [activeGroupId, allStudents, lessonDate, setAuraMap, flashAuraActionCells, clearActionHighlight, t]);

    const redoAuraOperation = useCallback(() => {
        if (activeGroupId === null || !sheetReadyRef.current) return;

        const hasRedoEntry = redoHistoryRef.current.length > 0;
        const entry = hasRedoEntry ? redoHistoryRef.current.pop() ?? null : null;
        const redoGenerationAtRequest = redoGenerationRef.current;
        const versionsAtRedo = new Map(cellVersionsRef.current);
        let resolveRedo: (saved: boolean) => void = () => undefined;
        const redoPersistence = new Promise<boolean>((resolve) => { resolveRedo = resolve; });
        const optimisticHistoryEntry = entry
            ? { ...entry, persisted: redoPersistence }
            : null;
        pendingWritesRef.current += 1;
        pendingRedoCountRef.current += 1;
        saveInFlightRef.current = true;
        setSaveState('saving');
        setSaveMessage('');

        if (entry) {
            const optimisticMap = [...auraMapRef.current];
            for (const cell of entry.cells) optimisticMap[cell.flatIndex] = cell.next;
            auraMapRef.current = optimisticMap;
            setAuraMap(optimisticMap);
            flashAuraActionCells('redo', entry.cells.map((cell) => cell.flatIndex));
            if (optimisticHistoryEntry) operationHistoryRef.current.push(optimisticHistoryEntry);
        }

        flushPendingSaves();
        queueRedoOperation(entry, hasRedoEntry, redoGenerationAtRequest, versionsAtRedo, optimisticHistoryEntry, resolveRedo);
    }, [activeGroupId, flashAuraActionCells, flushPendingSaves, queueRedoOperation, setAuraMap]);

    useEffect(() => {
        undoAuraRef.current = undoAuraOperation;
        redoAuraRef.current = redoAuraOperation;
    }, [undoAuraOperation, redoAuraOperation]);

    const saveCellValue = async (flatIndex: number, value: string) => {
        if (!sheetReadyRef.current) return;
        const aura = Number(value);
        if (!Number.isInteger(aura) || aura < -10000 || aura > 10000) {
            saveErrorRef.current = true;
            setSaveState('error');
            setSaveMessage(t('manage.errors.invalidAura'));
            return;
        }
        if ((auraMapRef.current[flatIndex] ?? 0) === aura) {
            setEditingCell(null);
            return;
        }

        const studentIndex = Math.floor(flatIndex / categories.length);
        const categoryIndex = flatIndex % categories.length;
        const student = chosenGroupStudents[studentIndex];
        const category = categories[categoryIndex];
        if (!student || !category) return;

        const nextMap = [...auraMapRef.current];
        nextMap[flatIndex] = aura;
        const saved = await persistChanges([{ studentId: student.id, category, aura }], nextMap);
        if (saved) setEditingCell(null);
    };

    const editingStudent = editingCell === null
        ? null
        : chosenGroupStudents[Math.floor(editingCell / categories.length)] ?? null;
    const editingCategory = editingCell === null
        ? null
        : categories[editingCell % categories.length] ?? null;

    const toggleCategorySelection = (categoryIndex: number) => {
        const shouldSelect = visibleStudentIndexes.some((studentIndex) =>
            selectionMap[studentIndex * categories.length + categoryIndex] !== 'selected',
        );
        const next = [...selectionMap];
        visibleStudentIndexes.forEach((studentIndex) => {
            next[studentIndex * categories.length + categoryIndex] = shouldSelect ? 'selected' : 'deselected';
        });
        setSelectionWithHistory(next);
    };

    const toggleLockedCategory = (categoryIndex: number) => {
        setLockedCategoryIndexes((current) => current.includes(categoryIndex)
            ? current.filter((index) => index !== categoryIndex)
            : [...current, categoryIndex]);
    };

    const selectStudentRow = (studentIndex: number) => {
        if (!sheetReadyRef.current || isStudentHidden(studentIndex)) return;
        const categoryIndexes = lockedCategoryIndexes.length > 0
            ? lockedCategoryIndexes
            : categories.map((_, index) => index);
        cursorRef.current = studentIndex * categories.length + categoryIndexes[0];
        const shouldSelect = categoryIndexes.some((categoryIndex) =>
            selectionMap[studentIndex * categories.length + categoryIndex] !== 'selected',
        );
        const nextSelection = [...selectionMap];
        categoryIndexes.forEach((categoryIndex) => {
            nextSelection[studentIndex * categories.length + categoryIndex] = shouldSelect ? 'selected' : 'deselected';
        });
        setSelectionWithHistory(nextSelection);
    };

    const selectCell = (flatIndex: number, additive: boolean) => {
        const studentIndex = Math.floor(flatIndex / categories.length);
        if (!sheetReadyRef.current || isStudentHidden(studentIndex)) return;
        cursorRef.current = flatIndex;
        const wasSelected = selectionMap[flatIndex] === 'selected';
        const nextSelection = !additive || wasSelected
            ? [...selectionMap]
            : Array(selectionMap.length).fill('deselected');
        nextSelection[flatIndex] = wasSelected ? 'deselected' : 'selected';
        setSelectionWithHistory(nextSelection);
    };

    const editCell = (flatIndex: number) => {
        const studentIndex = Math.floor(flatIndex / categories.length);
        if (!sheetReadyRef.current || isStudentHidden(studentIndex)) return;
        cursorRef.current = flatIndex;
        setSelectionWithHistory(Array(selectionMap.length).fill('deselected'));
        setEditingCell(flatIndex);
        setEditingAura(String(auraMap[flatIndex] ?? 0));
    };

    const toggleHideAbsent = () => {
        const nextHideAbsent = !hideAbsent;
        if (nextHideAbsent && saveState !== 'loading' && saveState !== 'error') {
            const nextSelection = [...selectionMapRef.current];
            let changed = false;
            chosenGroupStudents.forEach((_, studentIndex) => {
                if ((auraMap[studentIndex * categories.length + attendanceCategoryIndex] ?? 0) !== 0) return;
                for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
                    const flatIndex = studentIndex * categories.length + categoryIndex;
                    if (nextSelection[flatIndex] === 'selected') {
                        nextSelection[flatIndex] = 'deselected';
                        changed = true;
                    }
                }
            });
            if (changed) setSelectionWithHistory(nextSelection);
        }
        saveHideAbsentPreference(hideAbsentPreferenceKey, nextHideAbsent);
    };

    const toggleShowZeroScores = () => {
        saveShowZeroPreference(showZeroStorageKey, !showZeroScores);
    };

    const selectGroup = (groupId: number) => {
        if (groupId === activeGroupId || saveInFlightRef.current) return;
        if (groupPreferenceKey) {
            void rememberManageGroup(groupId).then((result) => {
                if (!result.ok) {
                    console.error('Could not remember the selected Manage group:', result.message);
                }
            }).catch((error: unknown) => {
                console.error('Could not remember the selected Manage group.', error);
            });
        }
        const nextStudentCount = allStudents.filter((student) => student.groupId === groupId).length;
        const nextCellCount = nextStudentCount * categories.length;
        selectionHistoryRef.current = [];
        namePrefixRef.current = '';
        cursorRef.current = 0;
        operationHistoryRef.current = [];
        redoGenerationRef.current += 1;
        redoHistoryRef.current = [];
        clearActionHighlight();
        setSaveState('loading');
        setSaveMessage('');
        sheetReadyRef.current = false;
        selectionHistoryRef.current = [];
        namePrefixRef.current = '';
        setActiveGroupId(groupId);
        setEditingCell(null);
        setSelectionMap(Array(nextCellCount).fill('deselected'));
        const emptyAuraMap = Array(nextCellCount).fill(0) as number[];
        auraMapRef.current = emptyAuraMap;
        savedAuraMapRef.current = [...emptyAuraMap];
        setAuraMap(emptyAuraMap);
    };

    if (!chosenGroupStudents || chosenGroupStudents.length === 0) {
        return (
            <div className="space-y-6">
                <section className="border-y border-line py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="eyebrow">{t('manage.header.workspace')}</p>
                            <h2 className="mt-1 text-xl font-semibold text-ink">{activeGroup?.name || groupsLabel}</h2>
                        </div>
                        <ScoringRulebook preferenceKey={hideAbsentPreferenceKey} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {allGroups.map((group) => (
                            <button key={group.id} type="button" onClick={() => selectGroup(group.id)} aria-pressed={activeGroupId === group.id} className={`chip ${activeGroupId === group.id ? 'chip-active' : ''}`}>
                                {group.name}
                            </button>
                        ))}
                    </div>
                </section>
                <div className="empty min-h-64">
                    <div className="text-sm font-semibold text-ink">{activeGroup ? t('manage.empty.noStudentsInGroup', { group: activeGroup.name }) : t('manage.empty.noGroupsYet')}</div>
                    <p className="mt-2 max-w-sm m-auto text-sm leading-6 text-faint">{activeGroup ? t('manage.empty.studentsAppearInMatrix') : t('manage.empty.createGroupPrompt')}</p>
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-5 pb-10" data-manage-page="true">
            <section className="border-y border-line py-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="eyebrow">{t('manage.header.workspace')}</p>
                        <h2 className="mt-1 text-xl font-semibold text-ink">{activeGroup?.name || groupsLabel}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-faint">
                            {t('manage.header.day')}
                            <input
                                type="date"
                                value={lessonDate}
                                max={initialLessonDate}
                                required
                                disabled={saveState === 'saving'}
                                onChange={(event) => {
                                    if (!event.target.value || saveInFlightRef.current) return;
                                    setEditingCell(null);
                                    sheetReadyRef.current = false;
                                    saveErrorRef.current = false;
                                    selectionHistoryRef.current = [];
                                    namePrefixRef.current = '';
                                    cursorRef.current = 0;
                                    operationHistoryRef.current = [];
                                    redoGenerationRef.current += 1;
                                    redoHistoryRef.current = [];
                                    clearActionHighlight();
                                    setSaveState('loading');
                                    setSaveMessage('');
                                    const nextCellCount = chosenGroupStudents.length * categories.length;
                                    const emptyAuraMap = Array(nextCellCount).fill(0) as number[];
                                    auraMapRef.current = emptyAuraMap;
                                    savedAuraMapRef.current = [...emptyAuraMap];
                                    setSelectionMap(Array(nextCellCount).fill('deselected'));
                                    setAuraMap(emptyAuraMap);
                                    setLessonDate(event.target.value);
                                }}
                                className="field btn-sm w-auto"
                            />
                        </label>
                        <span aria-live="polite" className={`text-xs ${saveState === 'error' ? 'text-danger' : saveState === 'saved' ? 'text-ok' : 'text-faint'}`}>
                            {saveState === 'loading' ? t('manage.status.loadingScores') : saveState === 'saving' ? t('manage.status.saving') : saveState === 'error' ? (saveMessage || t('manage.status.notSaved')) : t('manage.status.saved')}
                        </span>
                        <span className="text-xs text-faint">{t('manage.header.groupCount', { count: allGroups.length })}</span>
                        <ScoringRulebook preferenceKey={hideAbsentPreferenceKey} />
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {allGroups.map((group) => (
                        <button type="button" onClick={() => selectGroup(group.id)} aria-pressed={activeGroupId === group.id} className={`chip ${activeGroupId === group.id ? 'chip-active' : ''}`} key={group.id}>
                            {group.name}
                        </button>
                    ))}
                </div>
            </section>
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                <section data-manage-grid="true" className="panel min-w-0 overflow-hidden text-ink">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
                        <div>
                            <h2 className="text-sm font-semibold text-ink">{t('manage.grid.title')}</h2>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                                <span className="text-faint">{t('manage.grid.summary', { visible: visibleStudentIndexes.length, total: chosenGroupStudents.length, categories: categories.length })}</span>
                                {nameSearchStatus && <span aria-live="polite" className="max-w-48 truncate text-lime-200">{nameSearchStatus}</span>}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-1.5 text-xs text-lime-200">
                                <span className="size-2 rounded-full bg-accent shadow-[0_0_10px_rgba(190,242,100,0.45)]" aria-hidden="true" />
                                {t('manage.grid.selectedCount', { count: selectedCellCount })}
                            </div>
                        </div>
                    </div>
                    <div role="region" aria-label={t('manage.grid.title')} tabIndex={0} className="overflow-x-auto p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-5">
                        <div className="min-w-162.5">
                            {/* Table Header */}
                            <div className="grid grid-cols-[minmax(150px,1.6fr)_repeat(6,minmax(68px,1fr))] items-center gap-2 border-b border-line px-1 pb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint sm:gap-3">
                                <div className="sticky left-0 z-20 bg-surface pl-2">
                                    <span>{t('manage.table.student')}</span>
                                </div>
                                {categories.map((cat, categoryIndex) => {
                                    const isLocked = lockedCategoryIndexes.includes(categoryIndex);
                                    const isFullySelected = visibleStudentIndexes.length > 0
                                        && visibleStudentIndexes.every((studentIndex) => selectionMap[studentIndex * categories.length + categoryIndex] === 'selected');
                                    const categoryLabel = categoryLabels[cat];
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            title={isLocked
                                                ? t('manage.grid.columnHeader.titleLocked', { category: categoryLabel })
                                                : t('manage.grid.columnHeader.titleUnlocked', { category: categoryLabel })}
                                            aria-label={isLocked
                                                ? t('manage.grid.columnHeader.ariaLocked', { category: categoryLabel })
                                                : t('manage.grid.columnHeader.ariaUnlocked', { category: categoryLabel })}
                                            data-manage-selection-control="true"
                                            aria-pressed={isFullySelected}
                                            onClick={(event) => {
                                                if (event.altKey) {
                                                    event.preventDefault();
                                                    toggleLockedCategory(categoryIndex);
                                                    return;
                                                }
                                                toggleCategorySelection(categoryIndex);
                                            }}
                                            className={`inline-flex items-center justify-center gap-1 rounded px-1 py-1 text-center transition-colors ${isFullySelected ? 'bg-accent/10 text-lime-200' : 'hover:bg-accent/5 hover:text-lime-200'} ${isLocked ? 'ring-1 ring-accent/50 text-lime-200' : ''}`}
                                        >
                                            {categoryLabel}
                                            {isLocked && <FiLock aria-hidden="true" className="size-2.5 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Table Body */}
                            <ManageGridRows
                                students={chosenGroupStudents}
                                categories={categories}
                                categoryLabels={categoryLabels}
                                auraMap={auraMap}
                                selectionMap={selectionMap}
                                lockedCategoryIndexes={lockedCategoryIndexes}
                                actionHighlight={actionHighlight}
                                saveState={saveState}
                                visibleStudentIndexes={visibleStudentIndexes}
                                showZeroScores={showZeroScores}
                                unnamedStudentLabel={unnamedStudentLabel}
                                studentLabel={studentLabel}
                                onSelectStudent={selectStudentRow}
                                onSelectCell={selectCell}
                                onEditCell={editCell}
                                onCellRef={(index, element) => { matrixCellsRef.current[index] = element; }}
                            />
                        </div>
                    </div>
                </section>
                <aside className="space-y-4">
                    {/* Stats strip */}
                    <section className="grid grid-cols-2 border-y border-line bg-canvas/45">
                        <div className="border-r border-line px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">{t('manage.stats.students')}</p>
                            <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{chosenGroupStudents.length}</p>
                        </div>
                        <div className="px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">{t('manage.stats.selected')}</p>
                            <p className="mt-1 text-xl font-semibold tabular-nums text-lime-200">{selectedCellCount}</p>
                        </div>
                    </section>

                    {/* Column defaults */}
                    <section className="panel p-4 sm:p-5">
                        <p className="eyebrow">{t('manage.sidebar.defaults')}</p>
                        <h2 className="mt-1 text-base font-semibold text-ink">{t('manage.sidebar.awardTitle')}</h2>
                        <p className="mt-1 text-xs leading-5 text-faint">{t('manage.sidebar.description')}</p>
                        <div className="mt-4 space-y-2">
                            {categories.map((cat) => (
                                <div key={cat} className="flex items-center justify-between gap-3">
                                    <span className="text-xs capitalize text-muted">{categoryLabels[cat]}</span>
                                    <input
                                        type="number"
                                        min={0}
                                        aria-label={t('manage.sidebar.defaultAmountForCategory', { category: categoryLabels[cat] })}
                                        value={columnDefaults[cat]}
                                        onChange={(e) => {
                                            const parsed = parseInt(e.target.value, 10);
                                            setColumnDefaults((prev) => ({
                                                ...prev,
                                                [cat]: Number.isFinite(parsed) && parsed >= 0 ? parsed : 20,
                                            }));
                                        }}
                                        className="w-16 rounded-md border border-line bg-canvas px-2 py-1.5 text-center font-mono text-sm tabular-nums text-ink outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                    <section aria-label={t('manage.sidebar.displayTitle')} className="panel flex flex-wrap items-center justify-end gap-2 p-2">
                        <button
                            type="button"
                            onClick={toggleShowZeroScores}
                            aria-label={showZeroScores ? t('manage.grid.showZero.ariaHide') : t('manage.grid.showZero.ariaShow')}
                            aria-pressed={showZeroScores}
                            title={showZeroScores ? t('manage.grid.showZero.titleHide') : t('manage.grid.showZero.titleShow')}
                            className={`btn btn-secondary btn-sm px-2 ${showZeroScores ? 'border-accent/60 bg-accent/10 text-lime-200' : 'text-muted hover:border-accent/60 hover:text-lime-200'}`}
                        >
                            +0
                        </button>
                        <button
                            type="button"
                            onClick={toggleHideAbsent}
                            aria-label={hideAbsent ? t('manage.grid.absent.ariaShow') : t('manage.grid.absent.ariaHide')}
                            aria-pressed={hideAbsent}
                            title={hideAbsent ? t('manage.grid.absent.titleShow') : t('manage.grid.absent.titleHide')}
                            className={`btn btn-secondary btn-sm px-2 ${hideAbsent ? 'border-accent/60 bg-accent/10 text-lime-200' : 'text-muted hover:border-accent/60 hover:text-lime-200'}`}
                        >
                            {hideAbsent
                                ? <FiEyeOff aria-hidden="true" className="size-4" />
                                : <FiEye aria-hidden="true" className="size-4" />}
                        </button>
                        <ManageExportControls
                            groupName={activeGroup?.name || groupLabel}
                            lessonDate={lessonDate}
                            students={chosenGroupStudents}
                            categories={categories}
                            categoryLabels={categoryLabels}
                            auraMap={auraMap}
                            isSaving={saveState === 'saving'}
                            unnamedStudentLabel={unnamedStudentLabel}
                            onBeforeExport={() => {
                                flushPendingSaves();
                                return writeQueueRef.current;
                            }}
                        />
                    </section>
                </aside>

            </div>
            {editingCell !== null && editingStudent && editingCategory && (
                <div
                    className="fixed inset-0 z-120 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setEditingCell(null);
                    }}
                >
                    <section role="dialog" aria-modal="true" aria-labelledby="score-correction-title" className="panel w-full max-w-sm p-5 shadow-2xl sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="eyebrow">{t('manage.modal.scoreCorrection')}</p>
                                <h2 id="score-correction-title" className="mt-1 text-lg font-semibold text-ink">{editingStudent.displayName || unnamedStudentLabel}</h2>
                                <p className="mt-1 text-sm capitalize text-faint">{categoryLabels[editingCategory]} · {activeGroup?.name} · {lessonDate}</p>
                            </div>
                            <button type="button" aria-label={t('manage.modal.closeCorrection')} title={t('manage.common.close')} onClick={() => setEditingCell(null)} className="rounded-md p-2 text-faint transition hover:bg-white/5 hover:text-ink">
                                <FiX aria-hidden="true" />
                            </button>
                        </div>
                        <label className="mt-6 block text-xs font-medium text-muted">
                            {t('manage.modal.correctTotalAura')}
                            <input
                                type="number"
                                min={-10000}
                                max={10000}
                                step={1}
                                autoFocus
                                value={editingAura}
                                onChange={(event) => setEditingAura(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        void saveCellValue(editingCell, editingAura);
                                    }
                                    if (event.key === 'Escape') setEditingCell(null);
                                }}
                                className="mt-2 h-14 w-full rounded-md border border-line bg-surface px-4 font-mono text-2xl tabular-nums text-ink outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/10"
                            />
                        </label>
                        <p className="mt-2 text-xs leading-5 text-faint">{t('manage.modal.saveNote')}</p>
                        {saveState === 'error' && saveMessage && <p role="alert" className="mt-3 text-sm text-danger">{saveMessage}</p>}
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setEditingCell(null)} className="btn btn-ghost">{t('manage.actions.cancel')}</button>
                            <button type="button" disabled={saveState === 'loading' || saveState === 'saving'} onClick={() => void saveCellValue(editingCell, editingAura)} className="btn btn-primary">
                                {saveState === 'saving' ? t('manage.status.saving') : t('manage.actions.saveCorrection')}
                            </button>
                        </div>
                        <p className="mt-4 text-[11px] leading-5 text-faint">{t('manage.modal.footerHelp')}</p>
                    </section>
                </div>
            )}
        </div >
    )
}