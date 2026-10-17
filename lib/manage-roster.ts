import { unstable_cache } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, profiles, students } from "@/lib/schema";

// Every admin write that changes groups, students, or student names calls updateTag with this.
export const MANAGE_ROSTER_TAG = "manage-roster";

const rosterCacheOptions = { tags: [MANAGE_ROSTER_TAG], revalidate: 300 };

const loadGroups = unstable_cache(
    () => db.select().from(groups).orderBy(asc(groups.name)),
    ["manage-roster-groups"],
    rosterCacheOptions,
);

const loadActiveStudents = unstable_cache(
    () => db.select({
        id: students.id,
        profileId: students.profileId,
        groupId: students.groupId,
        status: students.status,
        createdAt: students.createdAt,
        displayName: profiles.displayName,
    })
        .from(students)
        .innerJoin(profiles, eq(students.profileId, profiles.id))
        .where(and(eq(profiles.status, "active"), eq(profiles.role, "student"))),
    ["manage-roster-students"],
    rosterCacheOptions,
);

// The cache stores JSON, so timestamps come back as strings and are rebuilt here.
export const getCachedManageGroups = async () =>
    (await loadGroups()).map((group) => ({ ...group, createdAt: new Date(group.createdAt) }));

export const getCachedActiveStudents = async () =>
    (await loadActiveStudents()).map((student) => ({ ...student, createdAt: new Date(student.createdAt) }));
