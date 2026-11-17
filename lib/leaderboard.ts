import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { LeaderboardData, LeaderboardGroup, LeaderboardStudent } from "./leaderboard-shared";

type QueryRow = {
    student_id: number;
    profile_id: number;
    group_id: number | null;
    group_name: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_id: string | null;
    avatar_url: string | null;
    total_aura: number | string;
    active_days: number | string;
    month_aura: number | string;
    month_active_days: number | string;
};

type GroupRow = {
    id: number;
    name: string;
    student_count: number | string;
};

export async function loadLeaderboardData(): Promise<LeaderboardData> {
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
        .toISOString()
        .slice(0, 10);
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
        .toISOString()
        .slice(0, 10);

    const [studentsResult, groupsResult] = await Promise.all([
        db.execute(sql`
            WITH current_month_scores AS (
                SELECT
                    student_id,
                    SUM(aura)::int AS month_aura,
                    COUNT(DISTINCT lesson_date)::int AS month_active_days
                FROM (
                    SELECT DISTINCT ON (student_id, lesson_date, category)
                        student_id,
                        lesson_date,
                        new_aura AS aura
                    FROM daily_aura_changes
                    WHERE lesson_date >= ${currentMonthStart}::date
                        AND lesson_date < ${nextMonthStart}::date
                    ORDER BY student_id, lesson_date, category, id DESC
                ) AS daily_scores
                GROUP BY student_id
            )
            SELECT
                s.id AS student_id,
                s.profile_id,
                s.group_id,
                g.name AS group_name,
                p.display_name,
                p.first_name,
                p.last_name,
                p.avatar_id,
                p.avatar_url,
                COALESCE(t.total_aura, 0)::int AS total_aura,
                COALESCE(t.active_days, 0)::int AS active_days,
                COALESCE(m.month_aura, 0)::int AS month_aura,
                COALESCE(m.month_active_days, 0)::int AS month_active_days
            FROM students s
            INNER JOIN profiles p ON p.id = s.profile_id AND p.role = 'student' AND p.status = 'active'
            LEFT JOIN groups g ON g.id = s.group_id
            LEFT JOIN student_aura_totals_ready t ON t.student_id = s.id
            LEFT JOIN current_month_scores m ON m.student_id = s.id
            WHERE s.status = 'active'
            ORDER BY total_aura DESC, active_days DESC, s.id ASC
        `),
        db.execute(sql`
            SELECT
                g.id,
                g.name,
                COUNT(s.id)::int AS student_count
            FROM groups g
            LEFT JOIN students s ON s.group_id = g.id AND s.status = 'active'
            GROUP BY g.id, g.name
            ORDER BY g.id ASC
        `),
    ]);

    const groupRanks = new Map<number, number>();
    const students: LeaderboardStudent[] = (studentsResult.rows as QueryRow[]).map((row, index) => {
        const groupId = row.group_id ?? null;
        let groupRank = 1;
        if (groupId !== null) {
            const current = groupRanks.get(groupId) ?? 0;
            groupRank = current + 1;
            groupRanks.set(groupId, groupRank);
        }

        const name = (row.display_name || [row.first_name, row.last_name].filter(Boolean).join(" ") || "Student").trim();

        return {
            studentId: Number(row.student_id),
            profileId: Number(row.profile_id),
            groupId,
            groupName: row.group_name,
            displayName: name,
            firstName: row.first_name,
            lastName: row.last_name,
            avatarId: row.avatar_id,
            avatarUrl: row.avatar_url,
            totalAura: Number(row.total_aura) || 0,
            activeDays: Number(row.active_days) || 0,
            monthAura: Number(row.month_aura) || 0,
            monthActiveDays: Number(row.month_active_days) || 0,
            globalRank: index + 1,
            groupRank,
        };
    });

    const groups: LeaderboardGroup[] = (groupsResult.rows as GroupRow[]).map((row) => ({
        id: Number(row.id),
        name: row.name,
        studentCount: Number(row.student_count) || 0,
    }));

    const topAura = students[0]?.totalAura ?? 0;

    return {
        students,
        groups,
        topAura,
        totalStudents: students.length,
        totalGroups: groups.length,
        currentMonthStart,
    };
}
