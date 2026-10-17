// Client-safe aura types and labels. No DB imports here.
import type { AuraCategory, Role } from "@/types/types";
import type { MessageKey } from "@/lib/i18n";

export interface CategoryTotal {
    category: AuraCategory;
    total: number;
}

export interface TrendPoint {
    day: string; // ISO date
    label: string; // short label e.g. "Mon"
    delta: number;
}

// What a student earns (received aura).
export interface StudentAuraStats {
    kind: "student";
    totalAura: number;
    daysActive: number;
    bestDay: { day: string; delta: number } | null;
    topCategory: { category: AuraCategory; total: number } | null;
    categoryTotals: CategoryTotal[];
    trend: TrendPoint[];
    attendance: { attended: number; total: number };
    camera: { on: number; total: number };
}

export interface StudentLeaderboardRanks {
    globalRank: number;
    groupRank: number | null;
}

// What a mentor oversees (aura across their groups).
export interface MentorAuraStats {
    kind: "mentor";
    groupCount: number;
    studentCount: number;
    activeStudents: number; // students with aura in last 7 days
    auraGivenWeek: number; // total delta across groups, last 7 days
    totalAura: number;
    categoryTotals: CategoryTotal[];
    trend: TrendPoint[];
}

// What an assistant supports (their assigned group's activity).
export interface AssistantAuraStats {
    kind: "assistant";
    groupCount: number;
    studentCount: number;
    activeStudents: number;
    auraGivenWeek: number;
    totalAura: number;
    categoryTotals: CategoryTotal[];
    trend: TrendPoint[];
}

export type ProfileAuraStats = StudentAuraStats | MentorAuraStats | AssistantAuraStats;

export type StatsRole = Extract<Role, "student" | "mentor" | "assistant">;

const CATEGORY_LABEL_KEYS: Record<AuraCategory, MessageKey> = {
    activity: "labels.category.activity",
    classwork: "labels.category.classwork",
    camera: "labels.category.camera",
    attendance: "labels.category.attendance",
    qa: "labels.category.qa",
    workout: "labels.category.workout",
};

export function categoryLabelKey(category: AuraCategory): MessageKey {
    return CATEGORY_LABEL_KEYS[category];
}
