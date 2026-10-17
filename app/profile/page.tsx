import { PageTitle } from "@/components/ui/PageTitle";
import { ProfileSettings } from "@/components/ProfileSettings";
import { authServer } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { getAssistantAuraStats, getMentorAuraStats, getStudentAuraStats } from "@/lib/aura-stats";
import type { ProfileAuraStats, StudentLeaderboardRanks } from "@/lib/aura-stats-shared";
import { getT } from "@/lib/i18n/server";
import { getRegionLocale } from "@/lib/region-server";
import { groupMembers, groups, profiles, students } from "@/lib/schema";
import { and, asc, eq } from "drizzle-orm";
import { getStudentLeaderboardRanks } from "@/lib/student-leaderboard";

export default async function ProfilePage() {
    const [locale, t, session] = await Promise.all([
        getRegionLocale(),
        getT(),
        authServer.getSession(),
    ]);

    if (!session?.user) {
        return (
            <>
                <PageTitle title={t("profile.page.title")} description={t("profile.page.description")} />
                <section className="max-w-xl border-y border-line py-6">
                    <h2 className="text-sm font-semibold text-ink">{t("profile.page.signInHeading")}</h2>
                    <p className="mt-2 text-sm leading-6 text-faint">{t("profile.page.signInDescription")}</p>
                </section>
            </>
        );
    }

    const [profile] = await db.select({
        id: profiles.id,
        displayName: profiles.displayName,
        role: profiles.role,
        status: profiles.status,
        avatarId: profiles.avatarId,
        bio: profiles.bio,
    }).from(profiles).where(eq(profiles.userId, session.user.id));

    const role = profile?.role ?? "anonymous";
    let groupNames: string[] = [];
    let studentGroup: { id: number; name: string } | null = null;
    let auraStats: ProfileAuraStats | null = null;
    let studentRanks: StudentLeaderboardRanks | null = null;
    if (profile?.id && role === "student") {
        const rows = await db.select({ id: groups.id, name: groups.name }).from(students)
            .innerJoin(groups, eq(students.groupId, groups.id))
            .where(eq(students.profileId, profile.id));
        groupNames = rows.map((row) => row.name);
        studentGroup = rows[0] ?? null;
        [auraStats, studentRanks] = await Promise.all([
            getStudentAuraStats(profile.id, locale),
            getStudentLeaderboardRanks(profile.id),
        ]);
    } else if (profile?.id && (role === "assistant" || role === "mentor")) {
        const rows = await db.select({ name: groups.name, groupId: groups.id }).from(groupMembers)
            .innerJoin(groups, eq(groupMembers.groupId, groups.id))
            .where(and(
                eq(groupMembers.profileId, profile.id),
                eq(groupMembers.role, role === "mentor" ? "owner" : "assistant"),
            ))
            .orderBy(asc(groups.name));
        groupNames = rows.map((row) => row.name);
        const groupIds = rows.map((row) => row.groupId);
        auraStats = role === "mentor" ? await getMentorAuraStats(groupIds, locale) : await getAssistantAuraStats(groupIds, locale);
    }

    return (
        <>
            <PageTitle title={t("profile.page.title")} description={t("profile.page.description")} />

            <ProfileSettings
                initialName={profile?.displayName || session.user.name}
                initialAvatarId={profile?.avatarId ?? null}
                initialBio={profile?.bio ?? ""}
                email={session.user.email}
                role={role}
                status={profile?.status ?? "active"}
                groupNames={groupNames}
                studentGroup={studentGroup}
                studentRanks={studentRanks}
                auraStats={auraStats}
            />
        </>
    );
}