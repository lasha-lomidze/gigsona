"use server";

import { and, eq, inArray, ne, notInArray } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { MANAGE_ROSTER_TAG } from "@/lib/manage-roster";
import { db } from "@/lib/db";
import { groupMembers, groups, mentors, profiles } from "@/lib/schema";
import { getT } from "@/lib/i18n/server";
import { formText, requireMentor, type AdminActionState } from "./action-helpers";

export async function createGroupAction(
    _previousState: AdminActionState,
    formData: FormData,
): Promise<AdminActionState> {
    const t = await getT();
    try {
        await requireMentor(t);

        const name = formText(formData, "name");
        const mentorId = Number.parseInt(formText(formData, "mentorId"), 10);
        const accessMode = formText(formData, "accessMode");

        if (name.length < 2 || !Number.isInteger(mentorId)) {
            return { status: "error", message: t("errors.admin.enterGroupNameAndChooseMentor") };
        }
        if (accessMode !== "free" && accessMode !== "locked") {
            return { status: "error", message: t("errors.common.chooseValidGroupAccessMode") };
        }

        const [mentor] = await db.select({ profileId: mentors.profileId })
            .from(mentors)
            .innerJoin(profiles, eq(mentors.profileId, profiles.id))
            .where(and(
                eq(mentors.id, mentorId),
                eq(profiles.role, "mentor"),
                eq(profiles.status, "active"),
            ));
        if (!mentor) return { status: "error", message: t("errors.admin.mentorNotFound") };

        const [existing] = await db.select({ id: groups.id }).from(groups).where(eq(groups.name, name));
        if (existing) return { status: "error", message: t("errors.admin.groupNameAlreadyUsed") };

        const [created] = await db.insert(groups).values({ name, accessMode }).returning({ id: groups.id });
        await db.insert(groupMembers).values({ groupId: created.id, profileId: mentor.profileId, role: "owner" });
        updateTag(MANAGE_ROSTER_TAG);
        revalidatePath("/admin");
        revalidatePath("/");
        return { status: "success", message: t("errors.admin.groupCreated", { name }) };
    } catch (error) {
        console.error("Group creation failed:", error);
        return {
            status: "error",
            message: error instanceof Error ? error.message : t("errors.admin.createGroupFailed"),
        };
    }
}

export async function updateGroupAction(
    _previousState: AdminActionState,
    formData: FormData,
): Promise<AdminActionState> {
    const t = await getT();
    try {
        await requireMentor(t);

        const groupId = Number.parseInt(formText(formData, "groupId"), 10);
        const name = formText(formData, "name");
        const accessMode = formText(formData, "accessMode");

        if (!Number.isInteger(groupId) || groupId <= 0 || name.length < 2) {
            return { status: "error", message: t("errors.admin.enterValidGroupName") };
        }
        if (accessMode !== "free" && accessMode !== "locked") {
            return { status: "error", message: t("errors.common.chooseValidGroupAccessMode") };
        }

        const [group] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId));
        if (!group) return { status: "error", message: t("errors.common.groupNotFound") };

        const [existing] = await db.select({ id: groups.id }).from(groups)
            .where(and(eq(groups.name, name), ne(groups.id, groupId)));
        if (existing) return { status: "error", message: t("errors.admin.groupNameAlreadyUsed") };

        await db.update(groups).set({ name, accessMode }).where(eq(groups.id, groupId));
        updateTag(MANAGE_ROSTER_TAG);
        revalidatePath("/admin");
        revalidatePath("/manage");
        revalidatePath("/history");
        revalidatePath("/");
        return { status: "success", message: t("errors.admin.groupUpdated", { name }) };
    } catch (error) {
        console.error("Group update failed:", error);
        return {
            status: "error",
            message: error instanceof Error ? error.message : t("errors.admin.updateGroupFailed"),
        };
    }
}

export async function assignGroupMentorAction(
    _previousState: AdminActionState,
    formData: FormData,
): Promise<AdminActionState> {
    const t = await getT();
    try {
        await requireMentor(t);

        const groupId = Number.parseInt(formText(formData, "groupId"), 10);
        const mentorIds = [...new Set(formData.getAll("mentorIds").map((value) => Number.parseInt(String(value), 10)))];
        if (!Number.isInteger(groupId) || mentorIds.length === 0 || mentorIds.some((id) => !Number.isInteger(id))) {
            return { status: "error", message: t("errors.admin.chooseAtLeastOneActiveMentor") };
        }

        const owners = await db.select({ profileId: mentors.profileId })
            .from(mentors)
            .innerJoin(profiles, eq(mentors.profileId, profiles.id))
            .where(and(
                inArray(mentors.id, mentorIds),
                eq(profiles.role, "mentor"),
                eq(profiles.status, "active"),
            ));
        if (owners.length !== mentorIds.length) return { status: "error", message: t("errors.admin.everyOwnerMustBeActiveMentor") };

        const [group] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId));
        if (!group) return { status: "error", message: t("errors.common.groupNotFound") };

        await db.delete(groupMembers).where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.role, "owner"),
            notInArray(groupMembers.profileId, owners.map((owner) => owner.profileId)),
        ));
        await db.insert(groupMembers)
            .values(owners.map((owner) => ({ groupId, profileId: owner.profileId, role: "owner" as const })))
            .onConflictDoUpdate({
                target: [groupMembers.groupId, groupMembers.profileId],
                set: { role: "owner" },
            });
        updateTag(MANAGE_ROSTER_TAG);
        revalidatePath("/admin");
        revalidatePath("/");
        return { status: "success", message: t("errors.admin.groupOwnersUpdated") };
    } catch (error) {
        console.error("Group owner assignment failed:", error);
        return { status: "error", message: error instanceof Error ? error.message : t("errors.admin.changeGroupOwnersFailed") };
    }
}
