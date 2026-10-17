// Server-only queries for the public overview page.
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { OverviewGroup, OverviewRow } from "@/lib/overview-shared";
import type { AuraCategory } from "@/types/types";

type RawRow = {
    group_id: number;
    group_name: string;
    mentor_name: string | null;
    student_id: number;
    profile_id: number | null;
    student_name: string | null;
    category: AuraCategory | null;
    final_aura: number | null;
    start_aura: number | null;
};

// Groups where at least one student ended the day with aura, including every active student in those groups.
export async function loadOverviewDay(lessonDate: string, fallbackStudentName: string): Promise<OverviewGroup[]> {
    const result = await db.execute(sql`
        WITH scores AS (
            SELECT
                d.group_id,
                d.student_id,
                d.category,
                COALESCE(sp.display_name, MAX(d.student_name)) AS student_name,
                (array_agg(d.new_aura ORDER BY d.id DESC))[1] AS final_aura,
                (array_agg(d.previous_aura ORDER BY d.id ASC))[1] AS start_aura
            FROM daily_aura_changes d
            LEFT JOIN students s ON s.id = d.student_id
            LEFT JOIN profiles sp ON sp.id = s.profile_id
            WHERE d.lesson_date = ${lessonDate}
            GROUP BY d.group_id, d.student_id, d.category, sp.display_name
        ),
        scored_students AS (
            SELECT group_id, student_id, SUM(final_aura) AS total_aura
            FROM scores
            GROUP BY group_id, student_id
        ),
        scored_groups AS (
            SELECT DISTINCT group_id
            FROM scored_students
            WHERE total_aura > 0
        ),
        candidates AS (
            SELECT group_id, student_id FROM scores
            UNION
            SELECT sg.group_id, s.id AS student_id
            FROM scored_groups sg
            JOIN students s ON s.group_id = sg.group_id AND s.status = 'active'
            JOIN profiles active_profile
                ON active_profile.id = s.profile_id
                AND active_profile.status = 'active'
                AND active_profile.role = 'student'
        )
        SELECT
            sg.group_id,
            g.name AS group_name,
            (
                SELECT string_agg(p.display_name, ', ' ORDER BY p.display_name)
                FROM group_members gm
                JOIN profiles p ON p.id = gm.profile_id
                WHERE gm.group_id = sg.group_id AND gm.role = 'owner'
            ) AS mentor_name,
            candidates.student_id,
            p.id AS profile_id,
            COALESCE(p.display_name, scores.student_name) AS student_name,
            scores.category,
            scores.final_aura,
            scores.start_aura
        FROM scored_groups sg
        JOIN groups g ON g.id = sg.group_id
        JOIN candidates ON candidates.group_id = sg.group_id
        LEFT JOIN students s ON s.id = candidates.student_id
        LEFT JOIN profiles p ON p.id = s.profile_id
        LEFT JOIN scores ON scores.group_id = candidates.group_id
            AND scores.student_id = candidates.student_id
    `);

    const groupsById = new Map<number, OverviewGroup & { byStudent: Map<number, OverviewRow> }>();
    for (const row of result.rows as RawRow[]) {
        let group = groupsById.get(row.group_id);
        if (!group) {
            group = { id: row.group_id, name: row.group_name, mentorName: row.mentor_name, totalGiven: 0, rows: [], byStudent: new Map() };
            groupsById.set(row.group_id, group);
        }
        let student = group.byStudent.get(row.student_id);
        if (!student) {
            student = { studentId: row.student_id, profileId: row.profile_id, name: row.student_name ?? fallbackStudentName, total: 0, rank: 0, categories: {} };
            group.byStudent.set(row.student_id, student);
            group.rows.push(student);
        }
        if (row.category !== null && row.final_aura !== null) {
            student.categories[row.category] = row.final_aura;
            student.total += row.final_aura;
            if (row.start_aura !== null) group.totalGiven += row.final_aura - row.start_aura;
        }
    }

    return Array.from(groupsById.values())
        .map(({ byStudent, ...group }) => {
            void byStudent;
            group.rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
            group.rows.forEach((student, index) => {
                const previous = group.rows[index - 1];
                student.rank = previous && previous.total === student.total ? previous.rank : index + 1;
            });
            return group;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}

export async function latestOverviewDateForGroup(groupId: number): Promise<string | null> {
    const result = await db.execute(sql`
        WITH latest_scores AS (
            SELECT
                lesson_date,
                student_id,
                category,
                new_aura,
                ROW_NUMBER() OVER (
                    PARTITION BY lesson_date, student_id, category
                    ORDER BY id DESC
                ) AS position
            FROM daily_aura_changes
            WHERE group_id = ${groupId}
        ),
        student_totals AS (
            SELECT lesson_date, student_id, SUM(new_aura) AS total_aura
            FROM latest_scores
            WHERE position = 1
            GROUP BY lesson_date, student_id
        )
        SELECT lesson_date::text AS lesson_date
        FROM student_totals
        GROUP BY lesson_date
        HAVING MAX(total_aura) > 0
        ORDER BY lesson_date DESC
        LIMIT 1
    `);
    return (result.rows[0] as { lesson_date: string } | undefined)?.lesson_date ?? null;
}

// The 90 most recent dates with recorded scores in any group, newest first.
export async function listOverviewDates() {
    const result = await db.execute(sql`
        WITH RECURSIVE recent_dates(lesson_date, position) AS (
            (
                SELECT lesson_date, 1
                FROM daily_aura_changes
                ORDER BY lesson_date DESC
                LIMIT 1
            )
            UNION ALL
            SELECT (
                SELECT d.lesson_date
                FROM daily_aura_changes d
                WHERE d.lesson_date < recent_dates.lesson_date
                ORDER BY d.lesson_date DESC
                LIMIT 1
            ), recent_dates.position + 1
            FROM recent_dates
            WHERE recent_dates.position < 90
              AND recent_dates.lesson_date IS NOT NULL
        )
        SELECT lesson_date::text AS lesson_date
        FROM recent_dates
        WHERE lesson_date IS NOT NULL
        ORDER BY lesson_date DESC
    `);
    return result.rows.map((row) => (row as { lesson_date: string }).lesson_date);
}
