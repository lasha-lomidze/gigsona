"use server";

import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { dailyAuraChanges, groupMembers, groups, mentors, profiles, students } from "@/lib/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { AuraCategory } from "@/types/types";
import { getTbilisiDate } from "@/lib/time";
import { getT } from "@/lib/i18n/server";

export type DailyAuraValue = {
    studentId: number;
    category: AuraCategory;
    aura: number;
    studentName?: string | null;
};

type Translate = Awaited<ReturnType<typeof getT>>;

const auraCategories: AuraCategory[] = ["activity", "classwork", "camera", "attendance", "qa", "workout"];
const validateLessonDate = (lessonDate: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lessonDate)) return false;
    const parsedDate = new Date(`${lessonDate}T12:00:00.000Z`);
    return !Number.isNaN(parsedDate.valueOf())
        && parsedDate.toISOString().slice(0, 10) === lessonDate
        && lessonDate <= getTbilisiDate();
};

const requireGroupScoringAccess = async (groupId: number, t: Translate) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error(t("errors.manage.signInToManageAuraScores"));

    // One query covers profile, group, mentor record and assistant membership.
    const [row] = await db.select({
        profileId: profiles.id,
        role: profiles.role,
        status: profiles.status,
        accessMode: groups.accessMode,
        mentorId: mentors.id,
        assistantGroupId: groupMembers.groupId,
    })
        .from(profiles)
        .leftJoin(groups, eq(groups.id, groupId))
        .leftJoin(mentors, eq(mentors.profileId, profiles.id))
        .leftJoin(groupMembers, and(
            eq(groupMembers.profileId, profiles.id),
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.role, "assistant"),
        ))
        .where(eq(profiles.userId, session.user.id));
    if (!row || row.status !== "active") throw new Error(t("errors.manage.activeAcademyProfileRequired"));
    if (!row.accessMode) throw new Error(t("errors.common.groupNotFound"));

    const access = { userId: session.user.id, profileId: row.profileId, role: row.role };
    if (row.role === "mentor") {
        if (!row.mentorId) throw new Error(t("errors.manage.activeMentorRecordRequired"));
        return access;
    }
    if (row.role === "assistant" && (row.assistantGroupId !== null || row.accessMode === "free")) {
        return access;
    }

    throw new Error(t("errors.manage.notAssignedToManageGroup"));
};

export async function rememberManageGroup(groupId: number) {
    const t = await getT();
    try {
        if (!Number.isSafeInteger(groupId) || groupId <= 0) {
            return { ok: false as const, message: t("errors.common.chooseValidGroup") };
        }

        const { profileId, role } = await requireGroupScoringAccess(groupId, t);

        const cookieStore = await cookies();
        cookieStore.set(
            `gigsona_manage_group_${role}_${profileId}`,
            String(groupId),
            {
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 365,
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
            },
        );
        return { ok: true as const };
    } catch (error) {
        console.error("Manage group preference save failed:", error);
        return {
            ok: false as const,
            message: error instanceof Error ? error.message : t("errors.manage.rememberSelectedGroupFailed"),
        };
    }
}

export async function loadDailyAuraSheet(input: { groupId: number; lessonDate: string }) {
    const t = await getT();
    try {
        if (!Number.isInteger(input.groupId) || !validateLessonDate(input.lessonDate)) {
            return { ok: false as const, message: t("errors.common.chooseValidGroupAndDate"), values: [] as DailyAuraValue[] };
        }

        // Access and read run together; values are only returned if the access check passes.
        const [, entries] = await Promise.all([
            requireGroupScoringAccess(input.groupId, t),
            db.select({
                studentId: dailyAuraChanges.studentId,
                category: dailyAuraChanges.category,
                aura: dailyAuraChanges.newAura,
                studentName: dailyAuraChanges.studentName,
            })
                .from(dailyAuraChanges)
                .where(and(
                    eq(dailyAuraChanges.groupId, input.groupId),
                    eq(dailyAuraChanges.lessonDate, input.lessonDate),
                ))
                .orderBy(asc(dailyAuraChanges.id)),
        ]);

        const latestValues = new Map<string, DailyAuraValue>();
        for (const entry of entries) {
            latestValues.set(`${entry.studentId}:${entry.category}`, entry);
        }
        return { ok: true as const, values: Array.from(latestValues.values()) };
    } catch (error) {
        console.error("Daily aura sheet load failed:", error);
        return { ok: false as const, message: error instanceof Error ? error.message : t("errors.manage.loadDayScoresFailed"), values: [] as DailyAuraValue[] };
    }
}

export async function saveDailyAuraOperations(input: {
    groupId: number;
    lessonDate: string;
    operations: DailyAuraValue[][];
}) {
    const t = await getT();
    try {
        if (!Number.isInteger(input.groupId) || !validateLessonDate(input.lessonDate)) {
            return { ok: false as const, message: t("errors.common.chooseValidGroupAndDate") };
        }
        const totalChanges = input.operations.reduce((total, operation) => total + operation.length, 0);
        if (input.operations.length === 0 || input.operations.length > 100
            || totalChanges === 0 || totalChanges > 500
            || input.operations.some((operation) => operation.length === 0)) {
            return { ok: false as const, message: t("errors.manage.chooseScoreCellRange") };
        }

        const { userId: changedBy } = await requireGroupScoringAccess(input.groupId, t);
        const operations = input.operations.map((operation) => {
            const deduplicated = new Map<string, DailyAuraValue>();
            for (const change of operation) {
                if (!Number.isInteger(change.studentId)
                    || !auraCategories.includes(change.category)
                    || !Number.isInteger(change.aura)
                    || change.aura < -10000
                    || change.aura > 10000) {
                    throw new Error(t("errors.manage.invalidAuraValues"));
                }
                deduplicated.set(`${change.studentId}:${change.category}`, change);
            }
            return { operationId: randomUUID(), changes: Array.from(deduplicated.values()) };
        });

        const studentIds = Array.from(new Set(operations.flatMap(({ changes }) => changes.map((change) => change.studentId))));
        const validStudents = await db.select({ id: students.id, displayName: profiles.displayName })
            .from(students)
            .innerJoin(profiles, eq(students.profileId, profiles.id))
            .where(and(
                inArray(students.id, studentIds),
                eq(students.groupId, input.groupId),
                eq(students.status, "active"),
                eq(profiles.role, "student"),
                eq(profiles.status, "active"),
            ));
        if (validStudents.length !== studentIds.length) {
            return { ok: false as const, message: t("errors.manage.studentsNoLongerActive") };
        }

        const nameByStudentId = new Map(validStudents.map((student) => [student.id, student.displayName]));

        const submittedJson = JSON.stringify(operations.flatMap(({ operationId, changes }, operationIndex) =>
            changes.map((change) => ({
                operation_index: operationIndex,
                operation_id: operationId,
                student_id: change.studentId,
                category: change.category,
                new_aura: change.aura,
                student_name: nameByStudentId.get(change.studentId) ?? null,
            })),
        ));

        const inserted = await db.execute(sql`
            WITH sheet_lock AS MATERIALIZED (
                SELECT pg_advisory_xact_lock(${input.groupId}, hashtext(${input.lessonDate}))
            ), submitted AS (
                SELECT operation_index, operation_id, student_id, category, new_aura, student_name
                FROM jsonb_to_recordset(${submittedJson}::jsonb)
                    AS row_data(operation_index integer, operation_id text, student_id integer, category text, new_aura integer, student_name text)
            ), ordered AS (
                SELECT
                    submitted.student_id,
                    submitted.category,
                    submitted.student_name,
                    submitted.new_aura,
                    submitted.operation_index,
                    submitted.operation_id,
                    lag(submitted.new_aura) OVER (
                        PARTITION BY submitted.student_id, submitted.category
                        ORDER BY submitted.operation_index
                    ) AS previous_submitted_aura
                FROM submitted
            ), current_values AS (
                SELECT
                    ordered.student_id,
                    ordered.category,
                    ordered.student_name,
                    ordered.new_aura,
                    ordered.operation_index,
                    ordered.operation_id,
                    COALESCE(ordered.previous_submitted_aura, (
                        SELECT history.new_aura
                        FROM daily_aura_changes AS history
                        WHERE history.group_id = ${input.groupId}
                            AND history.lesson_date = ${input.lessonDate}
                            AND history.student_id = ordered.student_id
                            AND history.category = ordered.category
                        ORDER BY history.id DESC
                        LIMIT 1
                    ), 0) AS previous_aura
                FROM ordered CROSS JOIN sheet_lock
            )
            INSERT INTO daily_aura_changes (
                group_id, student_id, lesson_date, category, student_name,
                previous_aura, new_aura, operation_id, changed_by
            )
            SELECT
                ${input.groupId}, student_id, ${input.lessonDate}, category, student_name,
                previous_aura, new_aura, operation_id, ${changedBy}
            FROM current_values
            WHERE previous_aura <> new_aura
            ORDER BY operation_index
            RETURNING student_id, category, new_aura
        `);

        revalidatePath("/history");
        return { ok: true as const, savedCount: inserted.rows.length };
    } catch (error) {
        console.error("Daily aura score save failed:", error);
        return { ok: false as const, message: error instanceof Error ? error.message : t("errors.manage.saveAuraChangesFailed") };
    }
}

export async function undoDailyAuraOperations(input: { groupId: number; lessonDate: string; count: number }) {
    const t = await getT();
    try {
        if (!Number.isInteger(input.groupId) || !validateLessonDate(input.lessonDate)
            || !Number.isInteger(input.count) || input.count < 1 || input.count > 100) {
            return { ok: false as const, message: t("errors.common.chooseValidGroupAndDate") };
        }
        const { userId: changedBy } = await requireGroupScoringAccess(input.groupId, t);
        const latestValues = new Map<string, DailyAuraValue>();
        let undoneCount = 0;
        let stopMessage = "";
        for (let step = 0; step < input.count; step += 1) {
            const result = await undoLatestOperation(input.groupId, input.lessonDate, changedBy, t);
            if (!result.ok) {
                stopMessage = result.message;
                break;
            }
            undoneCount += 1;
            for (const value of result.values) latestValues.set(`${value.studentId}:${value.category}`, value);
        }
        if (undoneCount > 0) revalidatePath("/history");
        if (undoneCount === 0) return { ok: false as const, message: stopMessage };
        return { ok: true as const, values: Array.from(latestValues.values()), undoneCount, message: stopMessage };
    } catch (error) {
        console.error("Daily aura undo failed:", error);
        return { ok: false as const, message: error instanceof Error ? error.message : t("errors.manage.undoAuraFailed") };
    }
}

export async function redoDailyAuraOperation(input: { groupId: number; lessonDate: string }) {
    const t = await getT();
    try {
        if (!Number.isInteger(input.groupId) || !validateLessonDate(input.lessonDate)) {
            return { ok: false as const, message: t("errors.common.chooseValidGroupAndDate") };
        }
        const { userId: changedBy } = await requireGroupScoringAccess(input.groupId, t);
        const redoOperationId = randomUUID();
        const result = await db.execute(sql`
            WITH sheet_lock AS MATERIALIZED (
                SELECT pg_advisory_xact_lock(${input.groupId}, hashtext(${input.lessonDate}))
            ), target_undo AS MATERIALIZED (
                SELECT undo.operation_id AS undo_operation_id, undo.undoes_operation_id AS target_operation_id
                FROM daily_aura_changes AS undo
                CROSS JOIN sheet_lock
                WHERE undo.group_id = ${input.groupId}
                    AND undo.lesson_date = ${input.lessonDate}
                    AND undo.changed_by = ${changedBy}
                    AND undo.is_undo = true
                    AND undo.undoes_operation_id IS NOT NULL
                    AND NOT EXISTS (
                        SELECT 1
                        FROM daily_aura_changes AS prior_redo
                        WHERE prior_redo.undoes_operation_id = undo.operation_id
                            AND prior_redo.is_undo = false
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM daily_aura_changes AS later_action
                        WHERE later_action.group_id = undo.group_id
                            AND later_action.lesson_date = undo.lesson_date
                            AND later_action.changed_by = undo.changed_by
                            AND later_action.id > undo.id
                            AND later_action.is_undo = false
                            AND later_action.undoes_operation_id IS NULL
                    )
                ORDER BY undo.id DESC
                LIMIT 1
            ), operation_rows AS MATERIALIZED (
                SELECT original.*
                FROM daily_aura_changes AS original
                WHERE original.operation_id = (SELECT target_operation_id FROM target_undo)
            ), conflicts AS MATERIALIZED (
                SELECT original.id
                FROM operation_rows AS original
                WHERE EXISTS (
                    SELECT 1
                    FROM daily_aura_changes AS later
                    WHERE later.group_id = original.group_id
                        AND later.lesson_date = original.lesson_date
                        AND later.student_id = original.student_id
                        AND later.category = original.category
                        AND later.id > original.id
                        AND later.is_undo = false
                        AND (
                            later.operation_id IS NULL
                            OR NOT EXISTS (
                                SELECT 1
                                FROM daily_aura_changes AS later_undo
                                WHERE later_undo.undoes_operation_id = later.operation_id
                            )
                        )
                )
            ), redone AS (
                INSERT INTO daily_aura_changes (
                    group_id, student_id, lesson_date, category, student_name,
                    previous_aura, new_aura, operation_id, changed_by,
                    is_undo, undoes_operation_id
                )
                SELECT
                    original.group_id, original.student_id, original.lesson_date,
                    original.category, original.student_name, original.previous_aura,
                    original.new_aura, ${redoOperationId}, ${changedBy}, false,
                    (SELECT undo_operation_id FROM target_undo)
                FROM operation_rows AS original
                WHERE NOT EXISTS (SELECT 1 FROM conflicts)
                RETURNING student_id, category, new_aura
            )
            SELECT
                (SELECT undo_operation_id FROM target_undo) AS undo_operation_id,
                (SELECT count(*)::int FROM operation_rows) AS operation_count,
                (SELECT count(*)::int FROM conflicts) AS conflict_count,
                COALESCE(
                    (SELECT json_agg(json_build_object('studentId', student_id, 'category', category, 'aura', new_aura)) FROM redone),
                    '[]'::json
                ) AS values
        `);

        const summary = result.rows[0] as {
            undo_operation_id: string | null;
            operation_count: number;
            conflict_count: number;
            values: DailyAuraValue[] | string;
        } | undefined;
        if (!summary?.undo_operation_id || summary.operation_count === 0) {
            return { ok: false as const, message: t("errors.manage.noSavedAuraActionToRedo") };
        }
        if (summary.conflict_count > 0) {
            return { ok: false as const, message: t("errors.manage.newerScoreChangesExist") };
        }

        const values = typeof summary.values === "string" ? JSON.parse(summary.values) as DailyAuraValue[] : summary.values;
        revalidatePath("/history");
        return { ok: true as const, values };
    } catch (error) {
        console.error("Daily aura redo failed:", error);
        return { ok: false as const, message: error instanceof Error ? error.message : t("errors.manage.redoAuraFailed") };
    }
}

async function undoLatestOperation(groupId: number, lessonDate: string, changedBy: string, t: Translate) {
    const input = { groupId, lessonDate };
    try {
        const undoOperationId = randomUUID();
        const result = await db.execute(sql`
            WITH sheet_lock AS MATERIALIZED (
                SELECT pg_advisory_xact_lock(${input.groupId}, hashtext(${input.lessonDate}))
            ), target_operation AS MATERIALIZED (
                SELECT history.operation_id
                FROM daily_aura_changes AS history
                CROSS JOIN sheet_lock
                WHERE history.group_id = ${input.groupId}
                    AND history.lesson_date = ${input.lessonDate}
                    AND history.changed_by = ${changedBy}
                    AND history.operation_id IS NOT NULL
                    AND history.is_undo = false
                    AND NOT EXISTS (
                        SELECT 1
                        FROM daily_aura_changes AS undone_marker
                        WHERE undone_marker.undoes_operation_id = history.operation_id
                    )
                ORDER BY history.id DESC
                LIMIT 1
            ), operation_rows AS MATERIALIZED (
                SELECT history.*
                FROM daily_aura_changes AS history
                WHERE history.operation_id = (SELECT operation_id FROM target_operation)
            ), conflicts AS MATERIALIZED (
                SELECT original.id
                FROM operation_rows AS original
                WHERE EXISTS (
                    SELECT 1
                    FROM daily_aura_changes AS later
                    WHERE later.group_id = original.group_id
                        AND later.lesson_date = original.lesson_date
                        AND later.student_id = original.student_id
                        AND later.category = original.category
                        AND later.id > original.id
                        AND later.is_undo = false
                        AND (
                            later.operation_id IS NULL
                            OR NOT EXISTS (
                                SELECT 1
                                FROM daily_aura_changes AS later_undo
                                WHERE later_undo.undoes_operation_id = later.operation_id
                            )
                        )
                )
            ), undone AS (
                INSERT INTO daily_aura_changes (
                    group_id, student_id, lesson_date, category, student_name,
                    previous_aura, new_aura, operation_id, changed_by,
                    is_undo, undoes_operation_id
                )
                SELECT
                    original.group_id, original.student_id, original.lesson_date,
                    original.category, original.student_name, original.new_aura,
                    original.previous_aura, ${undoOperationId}, ${changedBy},
                    true, (SELECT operation_id FROM target_operation)
                FROM operation_rows AS original
                WHERE NOT EXISTS (SELECT 1 FROM conflicts)
                RETURNING student_id, category, new_aura
            )
            SELECT
                (SELECT operation_id FROM target_operation) AS target_operation_id,
                (SELECT count(*)::int FROM operation_rows) AS operation_count,
                (SELECT count(*)::int FROM conflicts) AS conflict_count,
                COALESCE(
                    (SELECT json_agg(json_build_object('studentId', student_id, 'category', category, 'aura', new_aura)) FROM undone),
                    '[]'::json
                ) AS values
        `);

        const summary = result.rows[0] as {
            target_operation_id: string | null;
            operation_count: number;
            conflict_count: number;
            values: DailyAuraValue[] | string;
        } | undefined;
        if (!summary?.target_operation_id || summary.operation_count === 0) {
            return { ok: false as const, message: t("errors.manage.noSavedAuraActionToUndo") };
        }
        if (summary.conflict_count > 0) {
            return { ok: false as const, message: t("errors.manage.newerScoreChangesExist") };
        }

        const values = typeof summary.values === "string" ? JSON.parse(summary.values) as DailyAuraValue[] : summary.values;
        return { ok: true as const, values };
    } catch (error) {
        console.error("Daily aura undo failed:", error);
        return { ok: false as const, message: error instanceof Error ? error.message : t("errors.manage.undoAuraFailed") };
    }
}
