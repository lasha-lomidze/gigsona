"use server";

import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { MANAGE_ROSTER_TAG } from "@/lib/manage-roster";
import { db } from "@/lib/db";
import { assistants, groupMembers, groups, mentors, profiles, students, users } from "@/lib/schema";
import { clearProfileGroups, setProfileGroups, transferOwnership } from "@/lib/group-members";
import { getT } from "@/lib/i18n/server";
import type { Role } from "@/types/types";
import { formText, requireAdminAccess, type AdminActionState, type Translate } from "./action-helpers";

const allowedRoles: Role[] = ["mentor", "assistant", "student"];

const roleLabelKey = (role: Role) => {
    switch (role) {
        case "anonymous":
            return "labels.role.anonymous" as const;
        case "student":
            return "labels.role.student" as const;
        case "mentor":
            return "labels.role.mentor" as const;
        case "assistant":
            return "labels.role.assistant" as const;
    }
};

const roleLabel = (t: Translate, role: Role) => t(roleLabelKey(role)).toLowerCase();
const statusLabel = (t: Translate, status: "active" | "inactive") =>
    t(status === "active" ? "labels.status.active" : "labels.status.inactive").toLowerCase();
const profileNameOrFallback = (t: Translate, name: string | null) => name || t("errors.admin.profileFallbackName");

const addRoleRecord = async (profileId: number, role: Role, groupId: number | null, groupIds: number[]) => {
    if (role === "mentor") {
        const existing = await db.select({ id: mentors.id }).from(mentors).where(eq(mentors.profileId, profileId));
        if (existing.length === 0) {
            await db.insert(mentors).values({ profileId, title: "Mentor" });
        }
    }

    if (role === "assistant") {
        const existing = await db.select({ id: assistants.id }).from(assistants).where(eq(assistants.profileId, profileId));
        if (existing.length === 0) {
            await db.insert(assistants).values({ profileId, title: "Assistant" });
        }
        await setProfileGroups(profileId, "assistant", groupIds);
    }

    if (role === "student") {
        const existing = await db.select({ id: students.id }).from(students).where(eq(students.profileId, profileId));
        if (existing.length === 0) {
            await db.insert(students).values({ profileId, groupId, status: "active" });
        } else {
            await db.update(students).set({ groupId, status: "active" }).where(eq(students.profileId, profileId));
        }
    }
};

const groupsForRole = async (profileId: number, role: Role) => {
    if (role === "student") {
        const [student] = await db.select({ groupId: students.groupId }).from(students).where(eq(students.profileId, profileId));
        return student?.groupId === null || student?.groupId === undefined ? [] : [student.groupId];
    }
    if (role === "assistant") {
        const rows = await db.select({ groupId: groupMembers.groupId })
            .from(groupMembers)
            .where(and(eq(groupMembers.profileId, profileId), eq(groupMembers.role, "assistant")));
        return rows.map((row) => row.groupId);
    }
    return [];
};

const transferMentorGroups = async (profileId: number, actingProfileId: number, t: Translate) => {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(groupMembers)
        .where(and(eq(groupMembers.profileId, profileId), eq(groupMembers.role, "owner")));
    if (count === 0) return;

    if (profileId !== actingProfileId) {
        await transferOwnership(profileId, actingProfileId);
        return;
    }

    const [replacement] = await db.select({ profileId: profiles.id })
        .from(profiles)
        .where(and(
            eq(profiles.role, "mentor"),
            eq(profiles.status, "active"),
            ne(profiles.id, profileId),
        ));
    if (!replacement) {
        throw new Error(t("errors.admin.mentorOwnsGroups"));
    }
    await transferOwnership(profileId, replacement.profileId);
};

const hasAnotherActiveMentor = async (profileId: number) => {
    const [otherMentor] = await db.select({ id: profiles.id }).from(profiles)
        .where(and(
            eq(profiles.role, "mentor"),
            eq(profiles.status, "active"),
            ne(profiles.id, profileId),
        ));
    return Boolean(otherMentor);
};

export async function changeProfileRoleAction(
    _previousState: AdminActionState,
    formData: FormData,
): Promise<AdminActionState> {
    const t = await getT();
    try {
        const actor = await requireAdminAccess(t);
        const profileId = Number.parseInt(formText(formData, "profileId"), 10);
        const role = formText(formData, "role") as Role;
        const requestedGroupIds = formData.getAll("groupIds").map((value) => String(value).trim()).filter(Boolean);
        const requestedGroupId = formText(formData, "groupId");

        if (!Number.isInteger(profileId) || !allowedRoles.includes(role)) {
            return { status: "error", message: t("errors.admin.chooseValidPersonAndRole") };
        }
        const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
        if (!profile || profile.role === "anonymous") {
            return { status: "error", message: t("errors.admin.profileNotFound") };
        }
        if (actor.role === "assistant" && (profile.role === "mentor" || role === "mentor")) {
            return { status: "error", message: t("errors.admin.assistantsCannotManageOrAssignMentorRoles") };
        }
        const hasGroupField = formData.has("groupId");
        const previousGroupIds = await groupsForRole(profile.id, profile.role);
        let groupIds: number[] = [];
        if (role === "assistant") {
            if (actor.role === "assistant") {
                groupIds = profile.role === "assistant" ? previousGroupIds : [];
            } else if (formData.has("groupIds")) {
                groupIds = requestedGroupIds.map(Number);
            } else if (profile.role === "assistant") {
                groupIds = previousGroupIds;
            }
        }
        let groupId = role === "student"
            ? (hasGroupField
                ? requestedGroupId ? Number(requestedGroupId) : null
                : previousGroupIds[0] ?? null)
            : groupIds[0] ?? null;
        if (groupId !== null && (!Number.isInteger(groupId) || groupId <= 0)) {
            return { status: "error", message: t("errors.common.chooseValidGroup") };
        }
        if (groupIds.some((id) => !Number.isInteger(id) || id <= 0)) {
            return { status: "error", message: t("errors.common.chooseValidGroups") };
        }
        groupIds = [...new Set(groupIds)];
        if (role === "mentor") groupId = null;
        const requestedGroupValues = role === "assistant" ? groupIds : groupId === null ? [] : [groupId];
        if (requestedGroupValues.length > 0) {
            const validGroups = await db.select({ id: groups.id }).from(groups).where(inArray(groups.id, requestedGroupValues));
            if (validGroups.length !== requestedGroupValues.length) {
                return { status: "error", message: t("errors.common.selectedGroupsNoLongerExist") };
            }
        }
        const unchanged = profile.role === role && (
            role === "mentor"
                || (role === "assistant"
                    ? [...groupIds].sort((a, b) => a - b).join(",") === [...previousGroupIds].sort((a, b) => a - b).join(",")
                    : groupId === (previousGroupIds[0] ?? null))
        );
        if (unchanged) {
            return { status: "success", message: t("errors.admin.noChangesToSave") };
        }

        if (profile.status === "active" && profile.role === "mentor" && role !== "mentor") {
            if (!await hasAnotherActiveMentor(profile.id)) {
                return { status: "error", message: t("errors.admin.addAnotherActiveMentorBeforeChangingLastRole") };
            }
            await transferMentorGroups(profile.id, actor.profileId, t);
        }

        await addRoleRecord(profile.id, role, groupId, groupIds);
        if (profile.role === "assistant" && role !== "assistant") {
            await clearProfileGroups(profile.id, "assistant");
        }
        await db.update(profiles).set({ role, updatedAt: new Date() }).where(eq(profiles.id, profile.id));

        updateTag(MANAGE_ROSTER_TAG);

        revalidatePath("/admin");
        revalidatePath("/manage");
        revalidatePath("/");
        return {
            status: "success",
            message: t("errors.admin.profileRoleChanged", {
                name: profileNameOrFallback(t, profile.displayName),
                role: roleLabel(t, role),
            }),
        };
    } catch (error) {
        console.error("Role change failed:", error);
        return { status: "error", message: error instanceof Error ? error.message : t("errors.admin.changeRoleFailed") };
    }
}

export async function setProfileStatusAction(
    _previousState: AdminActionState,
    formData: FormData,
): Promise<AdminActionState> {
    const t = await getT();
    try {
        const actor = await requireAdminAccess(t);
        const profileId = Number.parseInt(formText(formData, "profileId"), 10);
        const status = formText(formData, "status");
        if (!Number.isInteger(profileId) || (status !== "active" && status !== "inactive")) {
            return { status: "error", message: t("errors.admin.chooseValidProfileStatus") };
        }

        const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
        if (!profile || profile.role === "anonymous") {
            return { status: "error", message: t("errors.admin.profileNotFound") };
        }
        if (actor.role === "assistant" && profile.role === "mentor") {
            return { status: "error", message: t("errors.admin.assistantsCannotChangeMentorStatus") };
        }
        if (profile.status === status) {
            return { status: "success", message: t("errors.admin.profileAlreadyStatus", { status: statusLabel(t, status) }) };
        }

        if (status === "inactive" && profile.role === "mentor") {
            if (!await hasAnotherActiveMentor(profile.id)) {
                return { status: "error", message: t("errors.admin.addAnotherActiveMentorBeforeDeactivatingLastMentor") };
            }
            await transferMentorGroups(profile.id, actor.profileId, t);
        }

        await db.update(profiles).set({ status, updatedAt: new Date() }).where(eq(profiles.id, profile.id));

        updateTag(MANAGE_ROSTER_TAG);

        revalidatePath("/admin");
        revalidatePath("/manage");
        revalidatePath("/");
        return {
            status: "success",
            message: t(
                status === "inactive" ? "errors.admin.profileDeactivated" : "errors.admin.profileReactivated",
                { name: profileNameOrFallback(t, profile.displayName) },
            ),
        };
    } catch (error) {
        console.error("Profile status change failed:", error);
        return { status: "error", message: error instanceof Error ? error.message : t("errors.admin.changeProfileStatusFailed") };
    }
}

export async function assignRoleAction(
    _previousState: AdminActionState,
    formData: FormData,
): Promise<AdminActionState> {
    const t = await getT();
    try {
        const actor = await requireAdminAccess(t);

        const role = formText(formData, "role") as Role;
        const mode = formText(formData, "mode");
        const name = formText(formData, "name");
        const email = formText(formData, "email").toLowerCase();
        const userId = formText(formData, "userId");
        const groupValues = formData.getAll("groupIds").map((value) => String(value).trim()).filter(Boolean);
        const groupValue = formText(formData, "groupId");

        if (!allowedRoles.includes(role)) {
            return { status: "error", message: t("errors.admin.chooseValidAcademyRole") };
        }
        if (actor.role === "assistant" && role === "mentor") {
            return { status: "error", message: t("errors.admin.assistantsCannotAssignMentorRoles") };
        }
        if (actor.role === "assistant" && groupValues.length > 0) {
            return { status: "error", message: t("errors.admin.assistantsCannotAssignAssistantsToGroups") };
        }

        let groupIds = role === "assistant" ? groupValues.map(Number) : [];
        if (groupValues.length > 0 && groupIds.some((id) => !Number.isInteger(id) || id <= 0)) {
            return { status: "error", message: t("errors.common.chooseValidGroups") };
        }
        const groupId = role === "assistant" ? groupIds[0] ?? null : groupValue ? Number(groupValue) : null;
        if (actor.role === "assistant" && role === "assistant" && groupValue) {
            return { status: "error", message: t("errors.admin.assistantsCannotAssignAssistantsToGroups") };
        }
        if (groupIds.some((id) => !Number.isInteger(id) || id <= 0)) {
            return { status: "error", message: t("errors.common.chooseValidGroups") };
        }
        if (groupValue && (!Number.isInteger(groupId) || groupId === null)) {
            return { status: "error", message: t("errors.common.chooseValidGroup") };
        }
        const requestedGroupValues = role === "assistant" ? [...new Set(groupIds)] : groupId === null ? [] : [groupId];
        if (role !== "mentor" && requestedGroupValues.length > 0) {
            const validGroups = await db.select({ id: groups.id }).from(groups).where(inArray(groups.id, requestedGroupValues));
            if (validGroups.length !== requestedGroupValues.length) {
                return { status: "error", message: t("errors.common.selectedGroupsNoLongerExist") };
            }
        }

        let profileId: number;
        let displayName: string;

        if (mode === "existing") {
            if (!userId) return { status: "error", message: t("errors.admin.selectExistingAccount") };
            const [account] = await db.select().from(users).where(eq(users.id, userId));
            if (!account) return { status: "error", message: t("errors.admin.accountNotFound") };
            const [existingProfile] = await db.select().from(profiles).where(eq(profiles.userId, account.id));
            if (existingProfile?.status === "inactive") {
                return { status: "error", message: t("errors.admin.profileInactiveReactivateBeforeChangingRole") };
            }
            if (existingProfile && existingProfile.role !== "anonymous" && existingProfile.role !== role) {
                return { status: "error", message: t("errors.admin.profileAlreadyHasDifferentRole") };
            }

            displayName = existingProfile?.displayName || account.name;
            if (existingProfile) {
                profileId = existingProfile.id;
                await db.update(profiles).set({
                    email: account.email.toLowerCase(),
                    displayName,
                    role,
                    updatedAt: new Date(),
                }).where(eq(profiles.id, profileId));
            } else {
                const [createdProfile] = await db.insert(profiles).values({
                    userId: account.id,
                    email: account.email.toLowerCase(),
                    displayName,
                    firstName: account.name.split(" ")[0] || account.name,
                    lastName: account.name.split(" ").slice(1).join(" ") || null,
                    role,
                }).returning({ id: profiles.id });
                profileId = createdProfile.id;
            }
        } else if (mode === "reserve") {
            if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return { status: "error", message: t("errors.admin.enterNameAndValidEmail") };
            }

            const [account] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
            if (account) {
                return { status: "error", message: t("errors.admin.accountAlreadyUsesEmailChooseLinkExisting") };
            }

            const [reserved] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, email));
            if (reserved) return { status: "error", message: t("errors.admin.profileAlreadyReservedForEmail") };

            displayName = name;
            const [createdProfile] = await db.insert(profiles).values({
                email,
                displayName: name,
                firstName: name.split(" ")[0] || name,
                lastName: name.split(" ").slice(1).join(" ") || null,
                role,
            }).returning({ id: profiles.id });
            profileId = createdProfile.id;
        } else {
            return { status: "error", message: t("errors.admin.chooseLinkOrReserve") };
        }

        if (actor.role === "assistant" && role === "assistant") {
            groupIds = await groupsForRole(profileId, "assistant");
        }
        await addRoleRecord(profileId, role, role === "mentor" ? null : groupId, [...new Set(groupIds)]);
        updateTag(MANAGE_ROSTER_TAG);
        revalidatePath("/admin");
        revalidatePath("/");
        return {
            status: "success",
            message: mode === "reserve"
                ? t("errors.admin.profileReserved", { name: displayName, role: roleLabel(t, role), email })
                : t("errors.admin.profileRoleChanged", { name: displayName, role: roleLabel(t, role) }),
        };
    } catch (error) {
        console.error("Role assignment failed:", error);
        return {
            status: "error",
            message: error instanceof Error ? error.message : t("errors.admin.updateAccountFailed"),
        };
    }
}
