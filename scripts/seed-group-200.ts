import { eq } from "drizzle-orm";
import { auth } from "../lib/auth";
import { db } from "../lib/db";
import { groupMembers, groups, mentors, profiles, students, users } from "../lib/schema";

const GROUP_NAME = "Group 200";
const PASSWORD = process.env.SEED_PASSWORD;
if (!PASSWORD || PASSWORD.length < 8) {
    throw new Error("Set SEED_PASSWORD to at least 8 characters before running this demo seed script.");
}

const demoStudents = Array.from({ length: 30 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
        name: `Demo Student ${number}`,
        email: `demo.student.${number}@example.invalid`,
    };
});

const ensureGroup = async () => {
    const [existing] = await db.select().from(groups).where(eq(groups.name, GROUP_NAME));
    if (existing) return existing.id;

    const [mentor] = await db.select().from(mentors).limit(1);
    if (!mentor) throw new Error("No mentor exists yet. Seed a mentor first so the group has an owner.");

    const [created] = await db
        .insert(groups)
        .values({ name: GROUP_NAME, accessMode: "free" })
        .returning({ id: groups.id });
    await db.insert(groupMembers).values({ groupId: created.id, profileId: mentor.profileId, role: "owner" });
    return created.id;
};

const seedStudent = async (name: string, email: string, groupId: number) => {
    let [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));

    if (!user) {
        const result = await auth.api.signUpEmail({ body: { name, email, password: PASSWORD } });
        user = { id: result.user.id };
    }

    let [profile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, user.id));

    if (profile) {
        await db
            .update(profiles)
            .set({ email, displayName: name, role: "student", status: "active" })
            .where(eq(profiles.id, profile.id));
    } else {
        [profile] = await db
            .insert(profiles)
            .values({
                userId: user.id,
                email,
                displayName: name,
                firstName: name.split(" ")[0],
                lastName: name.split(" ").slice(1).join(" ") || null,
                role: "student",
            })
            .returning({ id: profiles.id });
    }

    const [existingStudent] = await db.select({ id: students.id }).from(students).where(eq(students.profileId, profile.id));
    if (existingStudent) {
        await db.update(students).set({ groupId }).where(eq(students.id, existingStudent.id));
    } else {
        await db.insert(students).values({ profileId: profile.id, groupId, status: "active" });
    }

    console.log(`Seeded student: ${name} <${email}>`);
};

const main = async () => {
    const groupId = await ensureGroup();
    for (const s of demoStudents) {
        await seedStudent(s.name, s.email, groupId);
    }
    console.log(`\nDone. ${demoStudents.length} students in "${GROUP_NAME}".\n`);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exit(1);
    });