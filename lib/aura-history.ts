import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { dailyAuraChanges, groups, profiles, students } from "@/lib/schema";
import type { HistoryEntry, HistoryStudent } from "@/lib/aura-history-shared";

export const isValidIsoDate = (value: string | undefined): value is string => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T12:00:00.000Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};

export const listHistoryGroups = () => db.select({ id: groups.id, name: groups.name }).from(groups).orderBy(asc(groups.name));

export async function loadGroupDay(groupId: number, lessonDate: string) {
    const t = await getT();
    const [rows, roster] = await Promise.all([
        db.select({
            id: dailyAuraChanges.id,
            operationId: dailyAuraChanges.operationId,
            studentId: dailyAuraChanges.studentId,
            studentName: dailyAuraChanges.studentName,
            category: dailyAuraChanges.category,
            previousAura: dailyAuraChanges.previousAura,
            newAura: dailyAuraChanges.newAura,
            changedBy: dailyAuraChanges.changedBy,
            createdAt: dailyAuraChanges.createdAt,
        })
            .from(dailyAuraChanges)
            .where(and(eq(dailyAuraChanges.groupId, groupId), eq(dailyAuraChanges.lessonDate, lessonDate)))
            .orderBy(desc(dailyAuraChanges.id)),
        db.select({ id: students.id, name: profiles.displayName })
            .from(students)
            .innerJoin(profiles, eq(students.profileId, profiles.id))
            .where(and(eq(students.groupId, groupId), eq(students.status, "active"), eq(profiles.status, "active"), eq(profiles.role, "student")))
            .orderBy(asc(profiles.displayName)),
    ]);

    const giverIds = Array.from(new Set(rows.map((row) => row.changedBy).filter((id): id is string => !!id)));
    const givers = giverIds.length
        ? await db.select({ userId: profiles.userId, name: profiles.displayName, role: profiles.role })
            .from(profiles)
            .where(inArray(profiles.userId, giverIds))
        : [];
    const giverByUser = new Map(givers.map((giver) => [giver.userId, giver]));

    const entries: HistoryEntry[] = rows.map((row) => {
        const giver = row.changedBy ? giverByUser.get(row.changedBy) : undefined;
        return {
            id: row.id,
            operationId: row.operationId,
            studentId: row.studentId,
            studentName: row.studentName ?? t("errors.history.studentFallback"),
            category: row.category,
            previousAura: row.previousAura,
            newAura: row.newAura,
            changedByName: giver?.name ?? t("errors.history.formerStaffMemberFallback"),
            changedByRole: giver?.role ?? null,
            createdAt: row.createdAt.toISOString(),
        };
    });

    const rosterStudents: HistoryStudent[] = roster.map((student) => ({
        id: student.id,
        name: student.name ?? t("errors.history.studentFallback"),
    }));
    return { entries, students: rosterStudents };
}

// Dates in the last 90 days that have recorded scores for the group.
export async function listActiveDates(groupId: number) {
    const rows = await db.execute(sql`
        SELECT lesson_date::text AS lesson_date
        FROM daily_aura_changes
        WHERE group_id = ${groupId}
        GROUP BY lesson_date
        ORDER BY lesson_date DESC
        LIMIT 90
    `);
    return rows.rows.map((row) => (row as { lesson_date: string }).lesson_date);
}
