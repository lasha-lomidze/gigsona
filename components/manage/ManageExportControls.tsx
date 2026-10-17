"use client";

import { useEffect, useRef, useState } from "react";
import { FiCamera, FiCheck, FiChevronDown, FiCopy, FiDownload, FiFileText, FiShare2 } from "react-icons/fi";
import { AuraTableSnapshot } from "@/components/AuraTableSnapshot";
import { useT } from "@/lib/i18n/use-t";
import type { AuraCategory } from "@/types/types";
import type { ManageStudent } from "./types";

interface ManageExportControlsProps {
    groupName: string;
    lessonDate: string;
    students: ManageStudent[];
    categories: AuraCategory[];
    categoryLabels: Record<AuraCategory, string>;
    auraMap: number[];
    isSaving: boolean;
    unnamedStudentLabel: string;
    onBeforeExport: () => Promise<void>;
}

export function ManageExportControls({
    groupName,
    lessonDate,
    students,
    categories,
    categoryLabels,
    auraMap,
    isSaving,
    unnamedStudentLabel,
    onBeforeExport,
}: ManageExportControlsProps) {
    const t = useT();
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [copyExcelStatus, setCopyExcelStatus] = useState<"idle" | "copied" | "error">("idle");
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const exportDropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!exportDropdownOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
                setExportDropdownOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setExportDropdownOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [exportDropdownOpen]);

    const getTableExportData = () => {
        const headers = [
            t("manage.table.student"),
            ...categories.map((category) => categoryLabels[category]),
            t("manage.table.total"),
        ];
        const rows = students.map((student, studentIndex) => {
            let studentTotal = 0;
            const scores = categories.map((_, categoryIndex) => {
                const score = auraMap[studentIndex * categories.length + categoryIndex] ?? 0;
                studentTotal += score;
                return score;
            });
            return [student.displayName || unnamedStudentLabel, ...scores, studentTotal];
        });
        const categoryTotals = categories.map((_, categoryIndex) =>
            students.reduce(
                (sum, _, studentIndex) => sum + (auraMap[studentIndex * categories.length + categoryIndex] ?? 0),
                0,
            ),
        );
        const totalRow = [t("manage.table.total"), ...categoryTotals, categoryTotals.reduce((sum, value) => sum + value, 0)];

        return { headers, rows, totalRow };
    };

    const handleCopyExcel = async () => {
        if (students.length === 0) return;

        try {
            await onBeforeExport();
            const { headers, rows, totalRow } = getTableExportData();
            const allRows = [headers, ...rows, totalRow];
            const tsvText = allRows.map((row) => row.join("\t")).join("\n");
            const htmlTable = `<table>
<thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
<tbody>
${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("\n")}
<tr>${totalRow.map((cell) => `<td><b>${cell}</b></td>`).join("")}</tr>
</tbody>
</table>`;

            if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            "text/plain": new Blob([tsvText], { type: "text/plain" }),
                            "text/html": new Blob([htmlTable], { type: "text/html" }),
                        }),
                    ]);
                } catch {
                    await navigator.clipboard.writeText(tsvText);
                }
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(tsvText);
            } else {
                throw new Error("Clipboard API unavailable");
            }

            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
            setCopyExcelStatus("copied");
            copyTimeoutRef.current = setTimeout(() => setCopyExcelStatus("idle"), 2500);
        } catch (error) {
            console.error("Failed to copy table for Excel:", error);
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
            setCopyExcelStatus("error");
            copyTimeoutRef.current = setTimeout(() => setCopyExcelStatus("idle"), 3000);
        }
    };

    const handleExportExcel = async () => {
        if (students.length === 0 || isExportingExcel) return;

        try {
            setIsExportingExcel(true);
            await onBeforeExport();
            const { headers, rows, totalRow } = getTableExportData();
            const worksheetData = [
                [`${groupName} — ${t("manage.export.sheetTitle")}`],
                [`${t("manage.export.dateLabel")}: ${lessonDate}`],
                [],
                headers,
                ...rows,
                totalRow,
            ];
            const XLSX = await import("xlsx");
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

            worksheet["!cols"] = [
                { wch: 24 },
                ...categories.map(() => ({ wch: 14 })),
                { wch: 14 },
            ];

            const workbook = XLSX.utils.book_new();
            const sheetName = (groupName || t("manage.export.sheetNameFallback"))
                .replace(/[:\\/?*[\]]/g, "_")
                .slice(0, 31);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

            const sanitizedGroupName = groupName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
            XLSX.writeFile(workbook, `${sanitizedGroupName}_${lessonDate}_aura.xlsx`);
        } catch (error) {
            console.error("Failed to export Excel file:", error);
        } finally {
            setIsExportingExcel(false);
        }
    };

    return (
        <div className="relative" ref={exportDropdownRef}>
            <AuraTableSnapshot
                groupName={groupName}
                lessonDate={lessonDate}
                students={students}
                categories={categories}
                auraMap={auraMap}
                isSaving={isSaving}
                onBeforeCapture={onBeforeExport}
                renderTrigger={({ copyPhoto, downloadPhoto, captureStatus }) => {
                    const isBusy = isExportingExcel || captureStatus === "capturing" || isSaving;
                    const hasActiveStatus = copyExcelStatus === "copied" || captureStatus === "copied" || captureStatus === "downloaded";
                    const hasErrorStatus = copyExcelStatus === "error" || captureStatus === "error";

                    return (
                        <>
                            <button
                                type="button"
                                onClick={() => setExportDropdownOpen((previous) => !previous)}
                                disabled={students.length === 0}
                                aria-haspopup="menu"
                                aria-expanded={exportDropdownOpen}
                                title={t("manage.export.triggerTitle")}
                                className={`btn btn-secondary btn-sm inline-flex items-center gap-2 text-ink transition-all hover:border-accent/60 hover:text-lime-200 ${hasActiveStatus
                                    ? "border-accent/60 bg-accent/10 font-medium text-lime-200"
                                    : hasErrorStatus
                                        ? "border-rose-500/60 bg-rose-500/10 text-rose-300"
                                        : exportDropdownOpen
                                            ? "border-accent/60 text-lime-200"
                                            : ""
                                    }`}
                            >
                                {hasActiveStatus
                                    ? <FiCheck aria-hidden="true" className="size-3.5 text-accent stroke-3" />
                                    : <FiShare2 aria-hidden="true" className="size-3.5 text-accent" />}
                                <span>
                                    {copyExcelStatus === "copied"
                                        ? t("manage.export.status.copiedForSheets")
                                        : captureStatus === "copied"
                                            ? t("manage.export.status.photoCopied")
                                            : captureStatus === "downloaded"
                                                ? t("manage.export.status.photoSaved")
                                                : isExportingExcel
                                                    ? t("manage.export.status.exporting")
                                                    : captureStatus === "capturing"
                                                        ? t("manage.export.status.capturing")
                                                        : t("manage.export.status.export")}
                                </span>
                                <FiChevronDown
                                    aria-hidden="true"
                                    className={`size-3 text-muted transition-transform duration-200 ${exportDropdownOpen ? "rotate-180 text-lime-200" : ""}`}
                                />
                            </button>
                            {exportDropdownOpen && (
                                <div
                                    role="menu"
                                    aria-orientation="vertical"
                                    className="absolute right-0 top-full z-110 mt-1.5 w-60 rounded-xl border border-line bg-surface/95 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.7),0_0_20px_rgba(163,230,53,0.06)] backdrop-blur-md animate-in fade-in slide-in-from-top-1"
                                >
                                    <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{t("manage.export.menu.spreadsheet")}</p>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        disabled={isBusy}
                                        onClick={() => {
                                            setExportDropdownOpen(false);
                                            void handleCopyExcel();
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-ink transition hover:bg-white/5 hover:text-lime-200 disabled:opacity-50"
                                    >
                                        <FiCopy aria-hidden="true" className="size-3.5 shrink-0 text-lime-300" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-medium">{t("manage.export.menu.copyForSheets")}</span>
                                            <span className="block text-[10px] text-faint">{t("manage.export.menu.copyForSheetsDescription")}</span>
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        disabled={isBusy}
                                        onClick={() => {
                                            setExportDropdownOpen(false);
                                            void handleExportExcel();
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-ink transition hover:bg-white/5 hover:text-lime-200 disabled:opacity-50"
                                    >
                                        <FiFileText aria-hidden="true" className="size-3.5 shrink-0 text-cyan-300" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-medium">{t("manage.export.menu.downloadExcel")}</span>
                                            <span className="block text-[10px] text-faint">{t("manage.export.menu.downloadExcelDescription")}</span>
                                        </span>
                                    </button>
                                    <div className="my-1 border-t border-line" />
                                    <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{t("manage.export.menu.visualSnapshot")}</p>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        disabled={isBusy}
                                        onClick={() => {
                                            setExportDropdownOpen(false);
                                            void copyPhoto();
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-ink transition hover:bg-white/5 hover:text-lime-200 disabled:opacity-50"
                                    >
                                        <FiCamera aria-hidden="true" className="size-3.5 shrink-0 text-accent" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-medium">{t("manage.export.menu.copyTablePhoto")}</span>
                                            <span className="block text-[10px] text-faint">{t("manage.export.menu.copyTablePhotoDescription")}</span>
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        disabled={isBusy}
                                        onClick={() => {
                                            setExportDropdownOpen(false);
                                            void downloadPhoto();
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-ink transition hover:bg-white/5 hover:text-lime-200 disabled:opacity-50"
                                    >
                                        <FiDownload aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-medium">{t("manage.export.menu.downloadPng")}</span>
                                            <span className="block text-[10px] text-faint">{t("manage.export.menu.downloadPngDescription")}</span>
                                        </span>
                                    </button>
                                </div>
                            )}
                        </>
                    );
                }}
            />
        </div>
    );
}
