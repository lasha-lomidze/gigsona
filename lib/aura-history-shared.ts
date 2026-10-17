import type { AuraCategory, Role } from "@/types/types";

export const historyCategories: AuraCategory[] = ["attendance", "camera", "activity", "qa", "classwork", "workout"];


export type HistoryStudent = { id: number; name: string };

export type HistoryEntry = {
    id: number;
    operationId: string | null;
    studentId: number;
    studentName: string;
    category: AuraCategory;
    previousAura: number;
    newAura: number;
    changedByName: string;
    changedByRole: Role | null;
    createdAt: string;
};

export type HistoryOperation = {
    key: string;
    changedByName: string;
    changedByRole: Role | null;
    createdAt: string;
    entries: HistoryEntry[];
    delta: number;
};

export const formatDelta = (value: number) => (value > 0 ? `+${value}` : String(value));

export const formatLongDate = (isoDate: string, locale: string) =>
    new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
        .format(new Date(`${isoDate}T12:00:00.000Z`));

export const formatShortDate = (isoDate: string, locale: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" })
        .format(new Date(`${isoDate}T12:00:00.000Z`));

export const formatTime = (iso: string, locale: string) =>
    new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Tbilisi" }).format(new Date(iso));

export const shiftDate = (isoDate: string, days: number) => {
    const date = new Date(`${isoDate}T12:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
};

export const groupOperations = (entries: HistoryEntry[]): HistoryOperation[] => {
    const byKey = new Map<string, HistoryOperation>();
    for (const entry of entries) {
        const key = entry.operationId ?? `entry-${entry.id}`;
        let operation = byKey.get(key);
        if (!operation) {
            operation = {
                key,
                changedByName: entry.changedByName,
                changedByRole: entry.changedByRole,
                createdAt: entry.createdAt,
                entries: [],
                delta: 0,
            };
            byKey.set(key, operation);
        }
        operation.entries.push(entry);
        operation.delta += entry.newAura - entry.previousAura;
    }
    return Array.from(byKey.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};
