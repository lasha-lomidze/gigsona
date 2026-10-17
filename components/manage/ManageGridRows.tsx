"use client";

import type { AuraCategory } from "@/types/types";
import type { SelectionState } from "@/hooks/useManage";
import { useT } from "@/lib/i18n/use-t";
import type { ManageStudent } from "./types";

type AuraActionHighlight = {
    action: "undo" | "redo";
    cells: ReadonlySet<number>;
};

interface ManageGridProps {
    students: ManageStudent[];
    categories: AuraCategory[];
    categoryLabels: Record<AuraCategory, string>;
    auraMap: number[];
    selectionMap: SelectionState[];
    lockedCategoryIndexes: number[];
    actionHighlight: AuraActionHighlight | null;
    saveState: "loading" | "saved" | "saving" | "error";
    visibleStudentIndexes: number[];
    showZeroScores: boolean;
    unnamedStudentLabel: string;
    studentLabel: string;
    onSelectStudent: (studentIndex: number) => void;
    onSelectCell: (flatIndex: number, additive: boolean) => void;
    onEditCell: (flatIndex: number) => void;
    onCellRef: (flatIndex: number, element: HTMLDivElement | null) => void;
}

export function ManageGridRows({
    students,
    categories,
    categoryLabels,
    auraMap,
    selectionMap,
    lockedCategoryIndexes,
    actionHighlight,
    saveState,
    visibleStudentIndexes,
    showZeroScores,
    unnamedStudentLabel,
    studentLabel,
    onSelectStudent,
    onSelectCell,
    onEditCell,
    onCellRef,
}: ManageGridProps) {
    const t = useT();
    const visibleStudents = new Set(visibleStudentIndexes);
    const allCategoryIndexes = categories.map((_, index) => index);

    return (
        <div className="mt-2 space-y-1">
            {students.map((student, studentIndex) => {
                if (!visibleStudents.has(studentIndex)) return null;

                const selectedCategories = lockedCategoryIndexes.length > 0
                    ? lockedCategoryIndexes
                    : allCategoryIndexes;
                const rowSelected = selectedCategories.every((categoryIndex) =>
                    selectionMap[studentIndex * categories.length + categoryIndex] === "selected",
                );

                return (
                    <div
                        key={student.id}
                        className="group grid grid-cols-[minmax(150px,1.6fr)_repeat(6,minmax(68px,1fr))] items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-white/2.5 sm:gap-3"
                    >
                        <div className="sticky left-0 z-10 min-w-0 bg-surface pl-2">
                            <button
                                type="button"
                                aria-label={t(
                                    lockedCategoryIndexes.length > 0
                                        ? "manage.grid.rowButton.ariaLocked"
                                        : "manage.grid.rowButton.ariaAll",
                                    { name: student.displayName || unnamedStudentLabel },
                                )}
                                data-manage-selection-control="true"
                                aria-pressed={rowSelected}
                                onClick={() => onSelectStudent(studentIndex)}
                                className="flex w-full flex-col rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                            >
                                <span className="truncate text-sm font-medium text-muted transition-colors group-hover:text-ink">
                                    {student.displayName || unnamedStudentLabel}
                                </span>
                            </button>
                        </div>

                        {categories.map((category, categoryIndex) => {
                            const flatIndex = studentIndex * categories.length + categoryIndex;
                            const selected = selectionMap[flatIndex] === "selected";
                            const action = actionHighlight?.cells.has(flatIndex)
                                ? actionHighlight.action
                                : null;
                            const value = auraMap[flatIndex] ?? 0;

                            return (
                                <div
                                    key={category}
                                    ref={(element) => onCellRef(flatIndex, element)}
                                    role="button"
                                    tabIndex={0}
                                    data-manage-cell="true"
                                    data-cell-index={flatIndex}
                                    aria-disabled={saveState === "loading"}
                                    aria-label={t("manage.grid.cell.ariaLabel", {
                                        name: student.displayName || studentLabel,
                                        category: categoryLabels[category],
                                        value,
                                    })}
                                    title={t("manage.grid.cell.title")}
                                    onClick={(event) => onSelectCell(flatIndex, event.altKey)}
                                    onDoubleClick={() => onEditCell(flatIndex)}
                                    className={`flex h-10 cursor-pointer select-none flex-col items-center justify-center rounded-md border transition-all duration-150 ${action === "undo"
                                        ? "scale-[0.98] border-cyan-300/70 bg-cyan-300/10 shadow-[0_0_18px_rgba(103,232,249,0.22)]"
                                        : action === "redo"
                                            ? "scale-[0.98] border-violet-300/70 bg-violet-300/10 shadow-[0_0_18px_rgba(196,181,253,0.22)]"
                                            : selected
                                                ? "scale-[0.98] border-accent/70 bg-accent/10 text-lime-200 shadow-[inset_0_0_18px_rgba(190,242,100,0.06),0_0_14px_rgba(190,242,100,0.10)]"
                                                : "border-line/80 bg-canvas/80 text-faint hover:border-neutral-600 hover:bg-surface/80 hover:text-muted"
                                        }`}
                                >
                                    <span className={`font-mono text-sm font-semibold tabular-nums ${action === "undo" ? "text-cyan-100" : action === "redo" ? "text-violet-100" : selected ? "text-lime-200" : "text-muted"}`}>
                                        {value === 0 && !showZeroScores ? "" : value >= 0 ? `+${value}` : value}
                                    </span>
                                    <span className={`text-[8px] font-bold uppercase tracking-[0.14em] ${action === "undo" ? "text-cyan-300/80" : action === "redo" ? "text-violet-300/80" : selected ? "text-accent/80" : "text-transparent"}`}>
                                        {action === "undo"
                                            ? t("manage.grid.cell.undo")
                                            : action === "redo"
                                                ? t("manage.grid.cell.redo")
                                                : t("manage.grid.cell.ready")}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
