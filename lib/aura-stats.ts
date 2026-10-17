// Server-side aura statistics, role-scoped.
// daily_aura_changes.new_aura is the cumulative per-(day, category) score,
// so a change's delta is new_aura - previous_aura.

import { db } from "@/lib/db";
import { students } from "@/lib/schema";
import type { AuraCategory } from "@/types/types";
import { eq, inArray, sql } from "drizzle-orm";
import type {
    AssistantAuraStats,
    CategoryTotal,
    MentorAuraStats,
    StudentAuraStats,
    TrendPoint,
} from "./aura-stats-shared";

export type { AssistantAuraStats, CategoryTotal, MentorAuraStats, ProfileAuraStats, StudentAuraStats, TrendPoint } from "./aura-stats-shared";
export { categoryLabelKey } from "./aura-stats-shared";

type CategoryTotalRow = { category: AuraCategory; total: number | string };
type TrendRow = { day: string; delta: number | string };

function parseJsonArray<T>(value: T[] | string | null): T[] {
    if (typeof value === "string") return JSON.parse(value) as T[];
    return value ?? [];
}

function lastNDays(n: number): string[] {
    const out: string[] = [];
    const today = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        out.push(d.toISOString().slice(0, 10));
    }
    return out;
}

function buildTrend(deltaByDay: Map<string, number>, days: number, locale: string): TrendPoint[] {
    return lastNDays(days).map((iso) => ({
        day: iso,
        label: new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale, { weekday: "short" }),
        delta: deltaByDay.get(iso) ?? 0,
    }));
}

// Aura received by a single student (their own profile view).
export async function getStudentAuraStats(profileId: number, locale: string): Promise<StudentAuraStats | null> {
    const [student] = await db.select({ id: students.id })
        .from(students)
        .where(eq(students.profileId, profileId));
    if (!student) return null;

    const weekDays = lastNDays(7);
    const weekStart = weekDays[0];
    const weekEnd = weekDays[weekDays.length - 1];
    const result = await db.execute(sql`
        WITH history AS (
            SELECT lesson_date, category, previous_aura, new_aura, id
            FROM daily_aura_changes
            WHERE student_id = ${student.id}
        ), latest AS (
            SELECT DISTINCT ON (lesson_date, category)
                lesson_date, category, new_aura, id
            FROM history
            ORDER BY lesson_date, category, id DESC
        ), category_totals AS (
            SELECT category, SUM(new_aura) AS total, MAX(id) AS latest_change_id
            FROM latest
            GROUP BY category
        ), daily_delta AS (
            SELECT lesson_date, SUM(new_aura - previous_aura) AS delta, MAX(id) AS last_change_id
            FROM history
            GROUP BY lesson_date
        ), week_history AS (
            SELECT lesson_date, previous_aura, new_aura
            FROM daily_aura_changes
            WHERE student_id = ${student.id}
                AND lesson_date BETWEEN ${weekStart}::date AND ${weekEnd}::date
        ), week_daily_delta AS (
            SELECT lesson_date, SUM(new_aura - previous_aura) AS delta
            FROM week_history
            GROUP BY lesson_date
        ), trend_days AS (
            SELECT generate_series(
                ${weekStart}::date,
                ${weekEnd}::date,
                interval '1 day'
            )::date AS day
        ), trend AS (
            SELECT trend_days.day, COALESCE(week_daily_delta.delta, 0) AS delta
            FROM trend_days
            LEFT JOIN week_daily_delta ON week_daily_delta.lesson_date = trend_days.day
        )
        SELECT
            (SELECT COUNT(DISTINCT lesson_date)::int FROM history) AS days_active,
            COALESCE((SELECT SUM(total) FROM category_totals), 0) AS total_aura,
            COALESCE((
                SELECT JSON_AGG(JSON_BUILD_OBJECT('category', category, 'total', total) ORDER BY total DESC, latest_change_id DESC)
                FROM category_totals
            ), '[]'::json) AS category_totals,
            (SELECT COUNT(*)::int FROM latest WHERE category = 'attendance') AS attendance_total,
            (SELECT COUNT(*)::int FROM latest WHERE category = 'attendance' AND new_aura > 0) AS attendance_attended,
            (SELECT COUNT(*)::int FROM latest WHERE category = 'camera') AS camera_total,
            (SELECT COUNT(*)::int FROM latest WHERE category = 'camera' AND new_aura > 0) AS camera_on,
            (
                SELECT lesson_date::text
                FROM daily_delta
                ORDER BY delta DESC, last_change_id DESC
                LIMIT 1
            ) AS best_day,
            (
                SELECT delta
                FROM daily_delta
                ORDER BY delta DESC, last_change_id DESC
                LIMIT 1
            ) AS best_delta,
            COALESCE((
                SELECT JSON_AGG(JSON_BUILD_OBJECT('day', day::text, 'delta', delta) ORDER BY day)
                FROM trend
            ), '[]'::json) AS trend
    `);

    type StudentSummaryRow = {
        days_active: number | string;
        total_aura: number | string;
        category_totals: CategoryTotalRow[] | string;
        attendance_total: number | string;
        attendance_attended: number | string;
        camera_total: number | string;
        camera_on: number | string;
        best_day: string | null;
        best_delta: number | string | null;
        trend: TrendRow[] | string;
    };
    const summary = result.rows[0] as StudentSummaryRow | undefined;
    if (!summary) return null;

    const categoryTotals = parseJsonArray(summary.category_totals).map(({ category, total }) => ({
        category,
        total: Number(total),
    }));
    const trendByDay = new Map(
        parseJsonArray(summary.trend).map(({ day, delta }) => [day, Number(delta)]),
    );
    const bestDelta = summary.best_delta === null ? 0 : Number(summary.best_delta);
    const topCategory = categoryTotals[0] && categoryTotals[0].total !== 0
        ? { category: categoryTotals[0].category, total: categoryTotals[0].total }
        : null;

    return {
        kind: "student",
        totalAura: Number(summary.total_aura),
        daysActive: Number(summary.days_active),
        bestDay: summary.best_day && bestDelta > 0 ? { day: summary.best_day, delta: bestDelta } : null,
        topCategory,
        categoryTotals,
        trend: buildTrend(trendByDay, 7, locale),
        attendance: { attended: Number(summary.attendance_attended), total: Number(summary.attendance_total) },
        camera: { on: Number(summary.camera_on), total: Number(summary.camera_total) },
    };
}

// Group oversight view shared by mentors and assistants.
async function getGroupOversight(groupIds: number[], locale: string): Promise<{
    studentCount: number;
    activeStudents: number;
    auraGivenWeek: number;
    totalAura: number;
    categoryTotals: CategoryTotal[];
    trend: TrendPoint[];
}> {
    const empty = { studentCount: 0, activeStudents: 0, auraGivenWeek: 0, totalAura: 0, categoryTotals: [] as CategoryTotal[], trend: buildTrend(new Map(), 7, locale) };
    if (groupIds.length === 0) return empty;

    const weekDays = lastNDays(7);
    const weekStart = weekDays[0];
    const weekEnd = weekDays[weekDays.length - 1];

    const [studentRows, result] = await Promise.all([
        db.select({ id: students.id, status: students.status }).from(students).where(inArray(students.groupId, groupIds)),
        db.execute(sql`
            WITH history AS (
                SELECT lesson_date, category, student_id, previous_aura, new_aura, id
                FROM daily_aura_changes
                WHERE group_id IN (${sql.join(groupIds.map((groupId) => sql`${groupId}`), sql`, `)})
            ), latest AS (
                SELECT DISTINCT ON (lesson_date, category, student_id)
                    lesson_date, category, student_id, new_aura, id
                FROM history
                ORDER BY lesson_date, category, student_id, id DESC
            ), category_totals AS (
                SELECT category, SUM(new_aura) AS total, MAX(id) AS latest_change_id
                FROM latest
                GROUP BY category
            ), week_history AS (
                SELECT lesson_date, student_id, new_aura - previous_aura AS delta
                FROM daily_aura_changes
                WHERE group_id IN (${sql.join(groupIds.map((groupId) => sql`${groupId}`), sql`, `)})
                    AND lesson_date BETWEEN ${weekStart}::date AND ${weekEnd}::date
            ), daily_delta AS (
                SELECT lesson_date, SUM(delta) AS delta
                FROM week_history
                GROUP BY lesson_date
            ), trend_days AS (
                SELECT generate_series(
                    ${weekStart}::date,
                    ${weekEnd}::date,
                    interval '1 day'
                )::date AS day
            ), trend AS (
                SELECT trend_days.day, COALESCE(daily_delta.delta, 0) AS delta
                FROM trend_days
                LEFT JOIN daily_delta ON daily_delta.lesson_date = trend_days.day
            )
            SELECT
                COALESCE((SELECT SUM(total) FROM category_totals), 0) AS total_aura,
                COALESCE((
                    SELECT JSON_AGG(JSON_BUILD_OBJECT('category', category, 'total', total) ORDER BY total DESC, latest_change_id DESC)
                    FROM category_totals
                ), '[]'::json) AS category_totals,
                COALESCE((SELECT SUM(delta) FROM week_history), 0) AS aura_given_week,
                (SELECT COUNT(DISTINCT student_id)::int FROM week_history WHERE delta <> 0) AS active_students,
                COALESCE((
                    SELECT JSON_AGG(JSON_BUILD_OBJECT('day', day::text, 'delta', delta) ORDER BY day)
                    FROM trend
                ), '[]'::json) AS trend
        `),
    ]);

    type GroupSummaryRow = {
        total_aura: number | string;
        category_totals: CategoryTotalRow[] | string;
        aura_given_week: number | string;
        active_students: number | string;
        trend: TrendRow[] | string;
    };
    const summary = result.rows[0] as GroupSummaryRow | undefined;
    if (!summary) throw new Error("Aura statistics query returned no summary row.");

    const categoryTotals = parseJsonArray(summary.category_totals).map(({ category, total }) => ({
        category,
        total: Number(total),
    }));
    const trendByDay = new Map(
        parseJsonArray(summary.trend).map(({ day, delta }) => [day, Number(delta)]),
    );

    return {
        studentCount: studentRows.filter((s) => s.status === "active").length,
        activeStudents: Number(summary.active_students),
        auraGivenWeek: Number(summary.aura_given_week),
        totalAura: Number(summary.total_aura),
        categoryTotals,
        trend: buildTrend(trendByDay, 7, locale),
    };
}

export async function getMentorAuraStats(groupIds: number[], locale: string): Promise<MentorAuraStats | null> {
    const o = await getGroupOversight(groupIds, locale);
    return { kind: "mentor", groupCount: groupIds.length, ...o };
}

export async function getAssistantAuraStats(groupIds: number[], locale: string): Promise<AssistantAuraStats | null> {
    const o = await getGroupOversight(groupIds, locale);
    return { kind: "assistant", groupCount: groupIds.length, ...o };
}
