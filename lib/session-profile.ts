import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import type { ProfileStatus, Role } from "@/types/types";

export type SessionProfile = {
    userId: string;
    profileId: number | null;
    role: Role;
    status: ProfileStatus;
};

// Role/status live on profiles only; Better Auth owns identity.
export const getSessionProfile = cache(async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { session: null, profile: null };

    const [row] = await db
        .select({ id: profiles.id, role: profiles.role, status: profiles.status })
        .from(profiles)
        .where(eq(profiles.userId, session.user.id));

    const profile: SessionProfile = {
        userId: session.user.id,
        profileId: row?.id ?? null,
        role: row && row.status === "active" ? row.role : "anonymous",
        status: row?.status ?? "active",
    };
    return { session, profile };
});
