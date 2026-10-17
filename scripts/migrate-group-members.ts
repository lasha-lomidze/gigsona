
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function columnExists(table: string, column: string) {
    const result = await db.execute(sql`
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
    `);
    return result.rows.length > 0;
}

async function tableExists(table: string) {
    const result = await db.execute(sql`SELECT to_regclass(${`public.${table}`}) AS name`);
    return result.rows[0]?.name != null;
}

async function main() {
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS group_members (
            group_id integer NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
            profile_id integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            role text NOT NULL,
            created_at timestamp NOT NULL DEFAULT now(),
            PRIMARY KEY (group_id, profile_id)
        )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS group_members_profile_idx ON group_members (profile_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS group_members_group_role_idx ON group_members (group_id, role)`);

    if (await columnExists("groups", "mentor_id")) {
        await db.execute(sql`
            INSERT INTO group_members (group_id, profile_id, role)
            SELECT g.id, m.profile_id, 'owner' FROM groups g JOIN mentors m ON m.id = g.mentor_id
            ON CONFLICT (group_id, profile_id) DO NOTHING
        `);
    }
    if (await tableExists("assistant_groups")) {
        await db.execute(sql`
            INSERT INTO group_members (group_id, profile_id, role)
            SELECT ag.group_id, a.profile_id, 'assistant' FROM assistant_groups ag JOIN assistants a ON a.id = ag.assistant_id
            ON CONFLICT (group_id, profile_id) DO NOTHING
        `);
    }
    if (await columnExists("assistants", "group_id")) {
        await db.execute(sql`
            INSERT INTO group_members (group_id, profile_id, role)
            SELECT group_id, profile_id, 'assistant' FROM assistants WHERE group_id IS NOT NULL
            ON CONFLICT (group_id, profile_id) DO NOTHING
        `);
    }
    // Profiles are the single source of truth for role; carry over any role only present on users.
    if (await columnExists("users", "role")) {
        await db.execute(sql`
            UPDATE profiles p SET role = u.role
            FROM users u
            WHERE p.user_id = u.id AND p.role = 'anonymous' AND u.role <> 'anonymous' AND p.status = 'active'
        `);
    }
    const [{ count }] = (await db.execute(sql`SELECT count(*)::int AS count FROM group_members`)).rows as { count: number }[];
    console.log(`group_members ready (${count} rows).`);
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
});
