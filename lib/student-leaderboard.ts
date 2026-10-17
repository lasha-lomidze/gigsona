import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { StudentLeaderboardRanks } from "@/lib/aura-stats-shared";

type RankRow = {
    global_rank: number | string;
    group_rank: number | string | null;
};

export async function getStudentLeaderboardRanks(profileId: number): Promise<StudentLeaderboardRanks | null> {
    const result = await db.execute(sql`
        WITH latest_scores AS (
            SELECT
                student_id,
                new_aura,
                ROW_NUMBER() OVER (
                    PARTITION BY student_id, lesson_date, category
                    ORDER BY id DESC
                ) AS position
            FROM daily_aura_changes
        ),
        lifetime_totals AS (
            SELECT student_id, SUM(new_aura) AS total_aura
            FROM latest_scores
            WHERE position = 1
            GROUP BY student_id
        ),
        student_leaderboard AS (
            SELECT s.profile_id, s.group_id, COALESCE(t.total_aura, 0) AS total_aura
            FROM students s
            INNER JOIN profiles p ON p.id = s.profile_id AND p.role = 'student'
            LEFT JOIN lifetime_totals t ON t.student_id = s.id
        ),
        target AS (
            SELECT profile_id, group_id, total_aura
            FROM student_leaderboard
            WHERE profile_id = ${profileId}
        )
        SELECT
            (
                SELECT COUNT(*) + 1
                FROM student_leaderboard competitor
                WHERE competitor.total_aura > target.total_aura
            )::int AS global_rank,
            CASE WHEN target.group_id IS NULL THEN NULL ELSE (
                SELECT COUNT(*) + 1
                FROM student_leaderboard competitor
                WHERE competitor.group_id = target.group_id
                    AND competitor.total_aura > target.total_aura
            )::int END AS group_rank
        FROM target
    `);

    const row = result.rows[0] as RankRow | undefined;
    return row
        ? {
            globalRank: Number(row.global_rank),
            groupRank: row.group_rank === null ? null : Number(row.group_rank),
        }
        : null;
}
