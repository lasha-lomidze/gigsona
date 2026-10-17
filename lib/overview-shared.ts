// Client-safe types for the overview page (NO db import).
import type { AuraCategory } from "@/types/types";

export type OverviewRow = {
    studentId: number;
    profileId: number | null;
    name: string;
    total: number;
    rank: number;
    categories: Partial<Record<AuraCategory, number>>;
};

export type OverviewGroup = {
    id: number;
    name: string;
    mentorName: string | null;
    totalGiven: number;
    rows: OverviewRow[];
};
