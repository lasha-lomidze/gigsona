
import { cookies } from "next/headers"
import { PageTitle } from "@/components/ui/PageTitle"
import { db } from "@/lib/db"
import { groupMembers } from "@/lib/schema"
import { Manage } from "@/components/Manage"
import { and, eq } from "drizzle-orm"
import { getTbilisiDate } from "@/lib/time"
import { getSessionProfile } from "@/lib/session-profile"
import { getCachedActiveStudents, getCachedManageGroups } from "@/lib/manage-roster"
import { loadDailyAuraSheet } from "@/actions/manage-aura"
import { getT } from "@/lib/i18n/server"

const page = async () => {
    const [{ profile }, t] = await Promise.all([getSessionProfile(), getT()]);

    const [allStudents, allGroups, assistantAssignments] = await Promise.all([
        getCachedActiveStudents(),
        getCachedManageGroups(),
        profile?.role === "assistant" && profile.profileId !== null
            ? db.select({ groupId: groupMembers.groupId })
                .from(groupMembers)
                .where(and(
                    eq(groupMembers.profileId, profile.profileId),
                    eq(groupMembers.role, "assistant"),
                ))
            : Promise.resolve([]),
    ]);
    const assistantGroupIds = new Set(assistantAssignments.map(({ groupId }) => groupId));
    const manageableGroups = profile?.role === "assistant"
        ? allGroups
            .filter((group) => group.accessMode === "free" || assistantGroupIds.has(group.id))
            .sort((a, b) => Number(assistantGroupIds.has(b.id)) - Number(assistantGroupIds.has(a.id)))
        : allGroups;
    const groupPreferenceKey = profile
        && profile.profileId !== null
        && (profile.role === "mentor" || profile.role === "assistant")
        ? `gigsona_manage_group_${profile.role}_${profile.profileId}`
        : undefined;
    const hideAbsentPreferenceKey = profile
        ? `gigsona_manage_hide_absent_${profile.profileId ?? profile.userId}`
        : "gigsona_manage_hide_absent_anonymous";
    const storedGroupId = groupPreferenceKey
        ? Number((await cookies()).get(groupPreferenceKey)?.value)
        : null;
    const initialGroupId = storedGroupId !== null
        && Number.isSafeInteger(storedGroupId)
        && manageableGroups.some((group) => group.id === storedGroupId)
        ? storedGroupId
        : undefined;

    const lessonDate = getTbilisiDate();
    const defaultGroupId = manageableGroups.find((group) => allStudents.some((student) => student.groupId === group.id))?.id
        ?? manageableGroups[0]?.id
        ?? null;
    const initialActiveGroupId = initialGroupId ?? defaultGroupId;
    const initialSheetResult = initialActiveGroupId !== null
        ? await loadDailyAuraSheet({ groupId: initialActiveGroupId, lessonDate })
        : null;
    const initialSheet = initialActiveGroupId !== null && initialSheetResult?.ok
        ? { groupId: initialActiveGroupId, lessonDate, values: initialSheetResult.values }
        : null;

    return (
        <>
            <PageTitle title={t("manage.page.title")} description={t("manage.page.description")} />
            <Manage
                allStudents={allStudents}
                allGroups={manageableGroups}
                initialLessonDate={lessonDate}
                groupPreferenceKey={groupPreferenceKey}
                hideAbsentPreferenceKey={hideAbsentPreferenceKey}
                initialGroupId={initialGroupId}
                initialSheet={initialSheet}
            />
        </>
    )
}

export default page