"use server";

import { auth } from "@/lib/auth";
import { revalidatePath, updateTag } from "next/cache";
import { MANAGE_ROSTER_TAG } from "@/lib/manage-roster";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auras, profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isValidAvatarId } from "@/lib/avatars";
import { getT } from "@/lib/i18n/server";

type ProfileNameState = { status: "idle" | "success" | "error"; message: string; savedName?: string; savedAvatarId?: string | null; savedBio?: string };

export async function saveProfileNameAction(
    _previousState: ProfileNameState,
    formData: FormData,
): Promise<ProfileNameState> {
    const t = await getT();
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { status: "error", message: t("errors.profile.signInToEditProfile") };

        const displayName = String(formData.get("displayName") ?? "").trim();
        if (displayName.length < 2 || displayName.length > 40) {
            return { status: "error", message: t("errors.profile.displayNameLength") };
        }

        const avatarIdRaw = String(formData.get("avatarId") ?? "").trim();
        const avatarId = avatarIdRaw || null;
        if (avatarId && !isValidAvatarId(avatarId)) {
            return { status: "error", message: t("errors.profile.chooseValidAvatar") };
        }

        const bioRaw = String(formData.get("bio") ?? "").trim();
        const bio = bioRaw.slice(0, 160);

        const [profile] = await db.select({ id: profiles.id })
            .from(profiles)
            .where(eq(profiles.userId, session.user.id));

        if (profile) {
            await db.update(profiles).set({ displayName, avatarId, bio, updatedAt: new Date() })
                .where(eq(profiles.id, profile.id));
        } else {
            await db.insert(profiles).values({
                userId: session.user.id,
                email: session.user.email.toLowerCase(),
                displayName,
                avatarId,
                bio,
                firstName: displayName.split(" ")[0] || displayName,
                lastName: displayName.split(" ").slice(1).join(" ") || null,
            });
        }

        revalidatePath("/profile");
        revalidatePath("/settings");
        updateTag(MANAGE_ROSTER_TAG);
        revalidatePath("/admin");
        return { status: "success", message: t("errors.profile.saved"), savedName: displayName, savedAvatarId: avatarId, savedBio: bio };
    } catch (error) {
        console.error("Profile settings save failed:", error);
        return { status: "error", message: error instanceof Error ? error.message : t("errors.profile.saveFailed") };
    }
}


export const claimSignupProfile = async (): Promise<{ ok: boolean; message: string }> => {
    const t = await getT();
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { ok: false, message: t("errors.auth.sessionExpired") };

        const userId = session.user.id;
        const email = session.user.email.trim().toLowerCase();
        const [reservedProfile] = await db.select().from(profiles).where(eq(profiles.email, email));

        if (reservedProfile?.status === "inactive") {
            return { ok: false, message: t("errors.auth.profileInactive") };
        }

        if (reservedProfile && (!reservedProfile.userId || reservedProfile.userId === userId)) {
            await db.update(profiles).set({
                userId,
                updatedAt: new Date(),
            }).where(eq(profiles.id, reservedProfile.id));
        } else if (reservedProfile) {
            return { ok: false, message: t("errors.auth.reservedProfileLinked") };
        } else {
            const [existingProfile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId));
            if (existingProfile) return { ok: true, message: t("errors.auth.accountReady") };

            await db.insert(profiles).values({
                userId,
                email,
                displayName: session.user.name,
                firstName: session.user.name.split(' ')[0] || session.user.name,
                lastName: session.user.name.split(' ').slice(1).join(' ') || null,
                role: 'anonymous',
            });
        }

        updateTag(MANAGE_ROSTER_TAG);

        revalidatePath('/admin');
        return { ok: true, message: t("errors.auth.accountReady") };
    } catch (error) {
        console.error("[Auth Error]:", error instanceof Error ? error.message : String(error));
        return { ok: false, message: t("errors.auth.accountSetupFailed") };
    }
}


// export const auras = pgTable("auras", {
//     id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
//     giverId: text("giver_id").notNull().references(() => users.id, { onDelete: "set null" }),
//     receiverId: text("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
//     category: text("category").$type<AuraCategory>().notNull(),
//     aura: integer("aura").notNull(),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
// });


export const giveAura = async ({ id: receiverId, aura }: { id: number; aura: number }) => {
    // !! uncomment when done testing
    // // 1. Fetch the secure session on the server
    // const session = await auth.api.getSession({
    //     headers: await headers()
    // });

    // // 2. Block unauthorized access
    // if (!session || !session.user) {
    //     throw new Error("Unauthorized: You must be logged in.");
    // }

    // // 3. Optional: Block students from giving points if using roles
    // if (session.user.role !== "mentor" && session.user.role !== "admin") {
    //     throw new Error("Forbidden: Only mentors can give points.");
    // }

    // 4. Safely perform the insert using the server-validated user ID
    await db.insert(auras).values({
        aura,
        giverId: "YanXOqCpDZDa8wQEEtKCKHpZbrfizVvf", // Securely injected on the server via session.user.id but leave this like this now for testing
        receiverId,
        category: "activity"
    });
};
