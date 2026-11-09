import type { AuraCategory } from '@/types/types';
import { categories } from './constants';

export const COLUMN_DEFAULTS_STORAGE_KEY = 'gigsona:columnDefaults';

export type ManageSortOption = 'alphabet' | 'joinDate' | 'todaysAura';
export type ManageSortDirection = 'asc' | 'desc';

export interface ManageSortPreference {
    option: ManageSortOption;
    direction: ManageSortDirection;
}

export const DEFAULT_MANAGE_SORT: ManageSortPreference = {
    option: 'alphabet',
    direction: 'asc',
};

const sortPreferenceListeners = new Map<string, Set<() => void>>();
const sortPreferenceValues = new Map<string, ManageSortPreference>();

function loadSortPreference(storageKey: string | undefined): ManageSortPreference {
    if (typeof window === 'undefined' || !storageKey) return DEFAULT_MANAGE_SORT;
    try {
        const raw = localStorage.getItem(`${storageKey}:sort`);
        if (!raw) return DEFAULT_MANAGE_SORT;
        const parsed = JSON.parse(raw) as Partial<ManageSortPreference>;
        const validOptions: ManageSortOption[] = ['alphabet', 'joinDate', 'todaysAura'];
        const validDirections: ManageSortDirection[] = ['asc', 'desc'];
        if (
            parsed
            && typeof parsed.option === 'string'
            && validOptions.includes(parsed.option as ManageSortOption)
            && typeof parsed.direction === 'string'
            && validDirections.includes(parsed.direction as ManageSortDirection)
        ) {
            return {
                option: parsed.option as ManageSortOption,
                direction: parsed.direction as ManageSortDirection,
            };
        }
        return DEFAULT_MANAGE_SORT;
    } catch (error) {
        console.error('Could not load the Manage sort preference.', error);
        return DEFAULT_MANAGE_SORT;
    }
}

export function subscribeToSortPreference(storageKey: string | undefined, onChange: () => void) {
    if (!storageKey || typeof window === 'undefined') return () => { };

    let listeners = sortPreferenceListeners.get(storageKey);
    if (!listeners) {
        listeners = new Set();
        sortPreferenceListeners.set(storageKey, listeners);
    }
    listeners.add(onChange);

    const preferenceKey = `${storageKey}:sort`;
    const handleStorage = (event: StorageEvent) => {
        if (event.key !== preferenceKey && event.key !== null) return;
        sortPreferenceValues.delete(storageKey);
        onChange();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener('storage', handleStorage);
        listeners?.delete(onChange);
        if (listeners?.size === 0) sortPreferenceListeners.delete(storageKey);
    };
}

export function getSortPreferenceSnapshot(storageKey: string | undefined): ManageSortPreference {
    if (!storageKey) return DEFAULT_MANAGE_SORT;
    if (sortPreferenceValues.has(storageKey)) return sortPreferenceValues.get(storageKey) ?? DEFAULT_MANAGE_SORT;
    const loaded = loadSortPreference(storageKey);
    sortPreferenceValues.set(storageKey, loaded);
    return loaded;
}

export function saveSortPreference(storageKey: string | undefined, value: ManageSortPreference) {
    if (!storageKey) return;
    sortPreferenceValues.set(storageKey, value);
    try {
        localStorage.setItem(`${storageKey}:sort`, JSON.stringify(value));
    } catch (error) {
        console.error('Could not save the Manage sort preference.', error);
    }
    sortPreferenceListeners.get(storageKey)?.forEach((onChange) => onChange());
}

const hideAbsentPreferenceListeners = new Map<string, Set<() => void>>();
const hideAbsentPreferenceValues = new Map<string, boolean>();

function loadHideAbsentPreference(storageKey: string | undefined): boolean {
    if (typeof window === 'undefined' || !storageKey) return false;
    try {
        return localStorage.getItem(`${storageKey}:hideAbsent`) === 'true';
    } catch (error) {
        console.error('Could not load the Manage absent-student preference.', error);
        return false;
    }
}

export function subscribeToHideAbsentPreference(storageKey: string | undefined, onChange: () => void) {
    if (!storageKey || typeof window === 'undefined') return () => { };

    let listeners = hideAbsentPreferenceListeners.get(storageKey);
    if (!listeners) {
        listeners = new Set();
        hideAbsentPreferenceListeners.set(storageKey, listeners);
    }
    listeners.add(onChange);

    const preferenceKey = `${storageKey}:hideAbsent`;
    const handleStorage = (event: StorageEvent) => {
        if (event.key !== preferenceKey && event.key !== null) return;
        hideAbsentPreferenceValues.delete(storageKey);
        onChange();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener('storage', handleStorage);
        listeners?.delete(onChange);
        if (listeners?.size === 0) hideAbsentPreferenceListeners.delete(storageKey);
    };
}

export function getHideAbsentPreferenceSnapshot(storageKey: string | undefined): boolean {
    if (!storageKey) return false;
    if (hideAbsentPreferenceValues.has(storageKey)) return hideAbsentPreferenceValues.get(storageKey) ?? false;
    return loadHideAbsentPreference(storageKey);
}

export function saveHideAbsentPreference(storageKey: string | undefined, value: boolean) {
    if (!storageKey) return;
    hideAbsentPreferenceValues.set(storageKey, value);
    try {
        localStorage.setItem(`${storageKey}:hideAbsent`, String(value));
    } catch (error) {
        console.error('Could not save the Manage absent-student preference.', error);
    }
    hideAbsentPreferenceListeners.get(storageKey)?.forEach((onChange) => onChange());
}

const showZeroPreferenceListeners = new Map<string, Set<() => void>>();
const showZeroPreferenceValues = new Map<string, boolean>();

export function subscribeToShowZeroPreference(storageKey: string, onChange: () => void) {
    let listeners = showZeroPreferenceListeners.get(storageKey);
    if (!listeners) {
        listeners = new Set();
        showZeroPreferenceListeners.set(storageKey, listeners);
    }
    listeners.add(onChange);

    const preferenceKey = `${storageKey}:showZeroScores`;
    const handleStorage = (event: StorageEvent) => {
        if (event.key !== preferenceKey && event.key !== null) return;
        showZeroPreferenceValues.delete(storageKey);
        onChange();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener('storage', handleStorage);
        listeners?.delete(onChange);
        if (listeners?.size === 0) showZeroPreferenceListeners.delete(storageKey);
    };
}

export function getShowZeroPreferenceSnapshot(storageKey: string) {
    if (showZeroPreferenceValues.has(storageKey)) return showZeroPreferenceValues.get(storageKey) ?? false;
    try {
        const showZeroScores = localStorage.getItem(`${storageKey}:showZeroScores`) === 'true';
        showZeroPreferenceValues.set(storageKey, showZeroScores);
        return showZeroScores;
    } catch (error) {
        console.error('Could not load the Manage zero-score display preference.', error);
        showZeroPreferenceValues.set(storageKey, false);
        return false;
    }
}

export function saveShowZeroPreference(storageKey: string, value: boolean) {
    showZeroPreferenceValues.set(storageKey, value);
    try {
        localStorage.setItem(`${storageKey}:showZeroScores`, String(value));
    } catch (error) {
        console.error('Could not save the Manage zero-score display preference.', error);
    }
    showZeroPreferenceListeners.get(storageKey)?.forEach((onChange) => onChange());
}

export function loadColumnDefaults(): Record<AuraCategory, number> {
    const fallback: Record<AuraCategory, number> = { attendance: 20, camera: 20, activity: 20, qa: 20, classwork: 20, workout: 20 };
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(COLUMN_DEFAULTS_STORAGE_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        for (const cat of categories) {
            const v = parsed[cat];
            if (typeof v === 'number' && Number.isFinite(v) && v >= 0) fallback[cat] = v;
        }
    } catch { /* corrupted data — use fallback */ }
    return fallback;
}
