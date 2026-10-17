import { PageTitle } from "@/components/ui/PageTitle";
import { DirectoryProfile } from "@/components/DirectoryProfile";
import { db } from "@/lib/db";
import { getAssistantAuraStats, getMentorAuraStats, getStudentAuraStats } from "@/lib/aura-stats";
import type { ProfileAuraStats, StudentLeaderboardRanks } from "@/lib/aura-stats-shared";
import { getT } from "@/lib/i18n/server";
import { getRegionLocale } from "@/lib/region-server";
import { groupMembers, groups, profiles, students, users } from "@/lib/schema";
import type { ProfileStatus, Role } from "@/types/types";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getStudentLeaderboardRanks } from "@/lib/student-leaderboard";

type DirectoryProfilePageProps = {
    params: Promise<{ profileId: string }>;
};

export default async function DirectoryProfilePage({ params }: DirectoryProfilePageProps) {
    const [locale, t] = await Promise.all([getRegionLocale(), getT()]);
    const { profileId: profileKey } = await params;
    if (profileKey.startsWith("user-")) {
        const userId = profileKey.slice("user-".length);
        if (!userId) return notFoundView(t);

        const [account] = await db.select({
            id: users.id,
            name: users.name,
        })
            .from(users)
            .leftJoin(profiles, eq(users.id, profiles.userId))
            .where(and(eq(users.id, userId), isNull(profiles.id)));

        if (!account) return notFoundView(t);
        return (
            <>
                <PageTitle title={t("profile.page.title")} description={t("profile.directory.description")} />
                <DirectoryProfile
                    name={account.name}
                    avatarId={null}
                    bio={null}
                    role="anonymous"
                    status="unassigned"
                    groups={[]}
                    studentGroup={null}
                    studentRanks={null}
                    auraStats={null}
                />
            </>
        );
    }

    if (!/^[1-9]\d*$/.test(profileKey)) return notFoundView(t);
    const id = Number(profileKey);
    if (!Number.isSafeInteger(id)) return notFoundView(t);

    const [profile] = await db.select({
        id: profiles.id,
        displayName: profiles.displayName,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        role: profiles.role,
        status: profiles.status,
        avatarId: profiles.avatarId,
        bio: profiles.bio,
    })
        .from(profiles)
        .where(eq(profiles.id, id));

    if (!profile) return notFoundView(t);

    const role = profile.role as Role;
    let profileGroups: { id: number; name: string }[] = [];
    let studentGroup: { id: number; name: string } | null = null;
    let auraStats: ProfileAuraStats | null = null;
    let studentRanks: StudentLeaderboardRanks | null = null;
    if (role === "student") {
        const rows = await db.select({ id: groups.id, name: groups.name }).from(students)
            .innerJoin(groups, eq(students.groupId, groups.id))
            .where(eq(students.profileId, profile.id));
        profileGroups = rows;
        studentGroup = rows[0] ?? null;
        [auraStats, studentRanks] = await Promise.all([
            getStudentAuraStats(profile.id, locale),
            getStudentLeaderboardRanks(profile.id),
        ]);
    } else if (role === "assistant" || role === "mentor") {
        const rows = await db.select({ id: groups.id, name: groups.name }).from(groupMembers)
            .innerJoin(groups, eq(groupMembers.groupId, groups.id))
            .where(and(
                eq(groupMembers.profileId, profile.id),
                eq(groupMembers.role, role === "mentor" ? "owner" : "assistant"),
            ))
            .orderBy(asc(groups.name));
        profileGroups = rows;
        const groupIds = rows.map((row) => row.id);
        auraStats = role === "mentor" ? await getMentorAuraStats(groupIds, locale) : await getAssistantAuraStats(groupIds, locale);
    }

    return (
        <>
            <PageTitle title={t("profile.page.title")} description={t("profile.directory.description")} />
            <DirectoryProfile
                name={profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || t("profile.directory.unnamedProfile")}
                avatarId={profile.avatarId}
                bio={profile.bio}
                role={role}
                status={profile.status as ProfileStatus}
                groups={profileGroups}
                studentGroup={studentGroup}
                studentRanks={studentRanks}
                auraStats={auraStats}
            />
        </>
    );
}

function notFoundView(t: Awaited<ReturnType<typeof getT>>) {
    return (
        <>
            <PageTitle title={t("profile.directory.notFoundTitle")} description={t("profile.directory.notFoundDescription")} />
            <p className="text-sm text-faint">{t("profile.directory.notFoundMessage")}</p>
        </>
    );
}
