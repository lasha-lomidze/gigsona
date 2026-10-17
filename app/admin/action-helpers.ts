import { getSessionProfile } from "@/lib/session-profile";
import { getT } from "@/lib/i18n/server";

export type AdminActionState = {
    status: "idle" | "success" | "error";
    message: string;
};

export type Translate = Awaited<ReturnType<typeof getT>>;

export const requireAdminAccess = async (t: Translate) => {
    const { profile } = await getSessionProfile();
    if (!profile || (profile.role !== "mentor" && profile.role !== "assistant") || profile.profileId === null) {
        throw new Error(t("errors.admin.manageProfilesAccessRequired"));
    }
    return { profileId: profile.profileId, role: profile.role };
};

export const requireMentor = async (t: Translate) => {
    const actor = await requireAdminAccess(t);
    if (actor.role !== "mentor") {
        throw new Error(t("errors.admin.manageMentorsGroupsAccessRequired"));
    }
    return { profileId: actor.profileId };
};

export const formText = (formData: FormData, key: string) =>
    String(formData.get(key) ?? "").trim();
