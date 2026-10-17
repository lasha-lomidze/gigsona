import { PageTitle } from "@/components/ui/PageTitle";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { getSessionProfile } from "@/lib/session-profile";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { getRegionLocale } from "@/lib/region-server";
import { assistants, dailyAuraChanges, groupMembers, groups, mentors, profiles, students, users } from "@/lib/schema";
import { and, asc, eq, isNull, or, sql } from "drizzle-orm";
import { getTbilisiDate } from "@/lib/time";

export default async function AdminPage() {
    const t = await getT();
    const { profile } = await getSessionProfile();
    const activeAdminProfile = profile?.role === "mentor" || profile?.role === "assistant" ? profile : null;

    if (!activeAdminProfile) {
        return (
            <>
                <PageTitle title={t("admin.page.title")} description={t("admin.page.description")} />
                <section className="panel max-w-xl border-l-2 border-accent p-6">
                    <p className="eyebrow">{t("admin.page.accessRequired")}</p>
                    <p className="mt-3 text-sm leading-6 text-muted">
                        {t("admin.page.accessDescription")}
                    </p>
                </section>
            </>
        );
    }

    const today = getTbilisiDate();
    const firstTrendDay = new Date(`${today}T12:00:00.000Z`);
    firstTrendDay.setUTCDate(firstTrendDay.getUTCDate() - 6);
    const trendStart = firstTrendDay.toISOString().slice(0, 10);
    const trendDays = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(`${trendStart}T12:00:00.000Z`);
        date.setUTCDate(date.getUTCDate() + index);
        return date.toISOString().slice(0, 10);
    });
    const requestedDays = sql.join(trendDays.map((day) => sql`SELECT ${day}::date AS day`), sql` UNION ALL `);

    const [accounts, mentorRows, assistantRows, assistantAssignmentRows, studentRows, groupBaseRows, ownerRows, trendResult] = await Promise.all([
        db.select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .leftJoin(profiles, eq(users.id, profiles.userId))
            .where(and(
                or(
                    isNull(profiles.id),
                    and(eq(profiles.role, "anonymous"), eq(profiles.status, "active")),
                ),
            ))
            .orderBy(asc(users.name)),
        db.select({
            id: mentors.id,
            profileId: profiles.id,
            name: profiles.displayName,
            email: sql<string | null>`coalesce(${profiles.email}, ${users.email})`,
            userId: profiles.userId,
            status: profiles.status,
        })
            .from(mentors)
            .innerJoin(profiles, eq(mentors.profileId, profiles.id))
            .leftJoin(users, eq(profiles.userId, users.id))
            .where(eq(profiles.role, "mentor"))
            .orderBy(asc(profiles.displayName)),
        db.select({
            id: assistants.id,
            profileId: profiles.id,
            name: profiles.displayName,
            email: sql<string | null>`coalesce(${profiles.email}, ${users.email})`,
            userId: profiles.userId,
            status: profiles.status,
        })
            .from(assistants)
            .innerJoin(profiles, eq(assistants.profileId, profiles.id))
            .leftJoin(users, eq(profiles.userId, users.id))
            .where(eq(profiles.role, "assistant"))
            .orderBy(asc(profiles.displayName)),
        db.select({
            profileId: assistants.profileId,
            groupId: groups.id,
            groupName: groups.name,
        })
            .from(groupMembers)
            .innerJoin(assistants, eq(groupMembers.profileId, assistants.profileId))
            .innerJoin(groups, eq(groupMembers.groupId, groups.id))
            .where(eq(groupMembers.role, "assistant"))
            .orderBy(asc(groups.name)),
        db.select({
            id: students.id,
            profileId: profiles.id,
            name: profiles.displayName,
            email: sql<string | null>`coalesce(${profiles.email}, ${users.email})`,
            userId: profiles.userId,
            groupId: students.groupId,
            groupName: groups.name,
            status: profiles.status,
        })
            .from(students)
            .innerJoin(profiles, eq(students.profileId, profiles.id))
            .leftJoin(users, eq(profiles.userId, users.id))
            .leftJoin(groups, eq(students.groupId, groups.id))
            .where(eq(profiles.role, "student"))
            .orderBy(asc(profiles.displayName)),
        db.select({
            id: groups.id,
            name: groups.name,
            accessMode: groups.accessMode,
        })
            .from(groups)
            .orderBy(asc(groups.name)),
        db.select({
            groupId: groupMembers.groupId,
            mentorId: mentors.id,
            name: profiles.displayName,
        })
            .from(groupMembers)
            .innerJoin(mentors, eq(groupMembers.profileId, mentors.profileId))
            .innerJoin(profiles, eq(groupMembers.profileId, profiles.id))
            .where(eq(groupMembers.role, "owner"))
            .orderBy(asc(mentors.id)),
        db.execute(sql`
            WITH requested_days AS (${requestedDays}), ranked_scores AS (
                SELECT
                    group_id,
                    lesson_date,
                    student_id,
                    category,
                    new_aura,
                    row_number() OVER (
                        PARTITION BY group_id, lesson_date, student_id, category
                        ORDER BY id DESC
                    ) AS revision_rank
                FROM ${dailyAuraChanges}
                WHERE lesson_date BETWEEN ${trendStart}::date AND ${today}::date
            ), daily_totals AS (
                SELECT lesson_date, sum(new_aura)::int AS net_aura
                FROM ranked_scores
                WHERE revision_rank = 1
                GROUP BY lesson_date
            )
            SELECT
                to_char(requested_days.day, 'YYYY-MM-DD') AS date,
                coalesce(daily_totals.net_aura, 0)::int AS total
            FROM requested_days
            LEFT JOIN daily_totals ON daily_totals.lesson_date = requested_days.day
            ORDER BY requested_days.day
        `),
    ]);
    const trendLocale = await getRegionLocale();
    const formatTrendDay = new Intl.DateTimeFormat(trendLocale, { month: "short", day: "numeric", timeZone: "UTC" });
    const scoringTrend = (trendResult.rows as { date: string; total: number }[]).map((day) => ({
        ...day,
        label: formatTrendDay.format(new Date(`${day.date}T12:00:00.000Z`)),
    }));
    const assignmentsByProfile = new Map<number, { id: number; name: string }[]>();
    for (const assignment of assistantAssignmentRows) {
        const assignments = assignmentsByProfile.get(assignment.profileId) ?? [];
        assignments.push({ id: assignment.groupId, name: assignment.groupName });
        assignmentsByProfile.set(assignment.profileId, assignments);
    }
    const assistantsWithGroups = assistantRows.map((assistant) => {
        const assignedGroups = assignmentsByProfile.get(assistant.profileId) ?? [];
        const groupNames = assignedGroups.map((group) => group.name);
        return {
            ...assistant,
            groupId: assignedGroups[0]?.id ?? null,
            groupIds: assignedGroups.map((group) => group.id),
            groupNames,
            groupName: groupNames.join(", "),
        };
    });
    const groupRows = groupBaseRows.map((group) => {
        const owners = ownerRows.filter((owner) => owner.groupId === group.id);
        return {
            ...group,
            mentorId: owners[0]?.mentorId ?? null,
            mentorName: owners.map((owner) => owner.name).join(", ") || null,
            ownerMentorIds: owners.map((owner) => owner.mentorId),
        };
    });
    const mentorsWithGroups = mentorRows.map((mentor) => ({
        ...mentor,
        groupNames: groupRows.filter((group) => group.ownerMentorIds.includes(mentor.id)).map((group) => group.name),
    }));

    return (
        <>
            <PageTitle title={t("admin.page.title")} description={t("admin.page.description")} />
            <AdminWorkspace
                accounts={accounts}
                mentors={mentorsWithGroups}
                assistants={assistantsWithGroups}
                students={studentRows}
                groups={groupRows}
                scoringTrend={scoringTrend}
                canManageMentorsAndGroups={activeAdminProfile.role === "mentor"}
            />
        </>
    );
}