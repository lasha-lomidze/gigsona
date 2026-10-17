import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { GroupMemberRole } from "@/types/types";

// Replaces the set of groups a profile holds `role` in, in one statement.
export async function setProfileGroups(profileId: number, role: GroupMemberRole, groupIds: number[]) {
    const wanted = sql.join(groupIds.map((groupId) => sql`${groupId}`), sql`, `);
    await db.execute(sql`
        WITH wanted(group_id) AS (
            SELECT unnest(ARRAY[${wanted}]::integer[])
        ), removed AS (
            DELETE FROM group_members
            WHERE profile_id = ${profileId}
                AND role = ${role}
                AND group_id NOT IN (SELECT group_id FROM wanted)
            RETURNING 1
        )
        INSERT INTO group_members (group_id, profile_id, role)
        SELECT group_id, ${profileId}, ${role} FROM wanted
        ON CONFLICT (group_id, profile_id) DO UPDATE SET role = EXCLUDED.role
    `);
}

export async function clearProfileGroups(profileId: number, role?: GroupMemberRole) {
    await db.execute(role
        ? sql`DELETE FROM group_members WHERE profile_id = ${profileId} AND role = ${role}`
        : sql`DELETE FROM group_members WHERE profile_id = ${profileId}`);
}

// Hands every group owned by `fromProfileId` to `toProfileId`.
export async function transferOwnership(fromProfileId: number, toProfileId: number) {
    await db.execute(sql`
        WITH moved AS (
            DELETE FROM group_members
            WHERE profile_id = ${fromProfileId} AND role = 'owner'
            RETURNING group_id
        )
        INSERT INTO group_members (group_id, profile_id, role)
        SELECT group_id, ${toProfileId}, 'owner' FROM moved
        ON CONFLICT (group_id, profile_id) DO UPDATE SET role = 'owner'
    `);
}
