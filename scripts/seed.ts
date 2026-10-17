import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth";
import { setProfileGroups } from "../lib/group-members";
import { db } from "../lib/db";
import { assistants, groupMembers, groups, mentors, profiles, students, users } from "../lib/schema";

type SeedRole = "mentor" | "assistant" | "student";
const MIN_PASSWORD_LENGTH = 8;
const DEMO_PASSWORD = process.env.SEED_PASSWORD;
const demoMentors = [
    { name: "Demo Mentor One", email: "mentor.one@example.invalid" },
    { name: "Demo Mentor Two", email: "mentor.two@example.invalid" },
];
const demoAssistants = [
    { name: "Demo Assistant One", email: "assistant.one@example.invalid", groupName: "Group 115" },
    { name: "Demo Assistant Two", email: "assistant.two@example.invalid", groupName: "Group 116" },
];
const demoStudents = [
    { name: "Demo Student One", email: "student.one@example.invalid", groupName: "Group 115" },
    { name: "Demo Student Two", email: "student.two@example.invalid", groupName: "Group 115" },
    { name: "Demo Student Three", email: "student.three@example.invalid", groupName: "Group 115" },
    { name: "Demo Student Four", email: "student.four@example.invalid", groupName: "Group 115" },
    { name: "Demo Student Five", email: "student.five@example.invalid", groupName: "Group 116" },
    { name: "Demo Student Six", email: "student.six@example.invalid", groupName: "Group 116" },
    { name: "Demo Student Seven", email: "student.seven@example.invalid", groupName: "Group 116" },
];

const rl = readline.createInterface({ input, output });

const ask = async (question: string, defaultValue = "") => {
    const answer = await rl.question(`${question}${defaultValue ? ` [${defaultValue}]` : ""}: `);
    return answer.trim() || defaultValue;
};

const askYesNo = async (question: string): Promise<boolean> => {
    const answer = (await ask(question, "n")).toLowerCase();
    return answer === "y" || answer === "yes";
};

const validatePassword = (password: string) => password.length >= MIN_PASSWORD_LENGTH;

const parseSeedEntries = (raw: string): string[] =>
    raw
        .split(/\n|,|;/)
        .map((value) => value.trim())
        .filter(Boolean);

const ensureGroup = async (groupName: string, ownerProfileId?: number) => {
    if (!groupName) return null;

    const existing = await db.select().from(groups).where(eq(groups.name, groupName));
    if (existing.length > 0) return existing[0].id;

    if (!ownerProfileId) {
        console.warn(`No mentor exists yet, so "${groupName}" was not assigned.`);
        return null;
    }

    const [createdGroup] = await db
        .insert(groups)
        .values({
            name: groupName,
            accessMode: "free",
        })
        .returning({ id: groups.id });
    if (createdGroup) {
        await db.insert(groupMembers).values({ groupId: createdGroup.id, profileId: ownerProfileId, role: "owner" });
    }

    return createdGroup?.id ?? null;
};

const ensureProfile = async (userId: string, name: string, role: SeedRole) => {
    const existingProfiles = await db.select().from(profiles).where(eq(profiles.userId, userId));

    if (existingProfiles.length > 0) {
        const profile = existingProfiles[0];
        const [account] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));

        await db
            .update(profiles)
            .set({
                email: account?.email.toLowerCase(),
                displayName: name,
                role,
                status: "active",
                updatedAt: new Date(),
            })
            .where(eq(profiles.id, profile.id));

        return profile;
    }

    const [profile] = await db
        .insert(profiles)
        .values({
            userId,
            email: (await db.select({ email: users.email }).from(users).where(eq(users.id, userId)))[0]?.email.toLowerCase(),
            displayName: name,
            firstName: name.split(" ")[0] ?? name,
            lastName: name.split(" ").slice(1).join(" ") || null,
            role,
        })
        .returning({ id: profiles.id });

    return profile;
};

const ensureRoleRecord = async (role: SeedRole, profileId: number, groupId: number | null) => {
    if (role === "mentor") {
        const existing = await db.select({ id: mentors.id }).from(mentors).where(eq(mentors.profileId, profileId));
        if (existing.length === 0) {
            await db.insert(mentors).values({ profileId, title: "Mentor" });
        }
        return;
    }

    if (role === "assistant") {
        const existing = await db.select({ id: assistants.id }).from(assistants).where(eq(assistants.profileId, profileId));
        if (existing.length === 0) {
            await db.insert(assistants).values({ profileId, title: "Assistant" });
        }
        await setProfileGroups(profileId, "assistant", groupId === null ? [] : [groupId]);
        return;
    }

    const existing = await db.select({ id: students.id }).from(students).where(eq(students.profileId, profileId));
    if (existing.length === 0) {
        await db.insert(students).values({ profileId, groupId, status: "active" });
    } else {
        await db.update(students).set({ groupId }).where(eq(students.profileId, profileId));
    }
};

const seedPerson = async (
    role: SeedRole,
    name: string,
    email: string,
    password: string,
    groupId: number | null = null,
) => {
    if (!validatePassword(password)) {
        throw new Error(`Password for ${email} must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail));
    let userId = existingUser?.id;

    if (!userId) {
        const result = await auth.api.signUpEmail({
            body: { name, email: normalizedEmail, password },
        });
        userId = result.user.id;
    }

    const profile = await ensureProfile(userId, name, role);
    await ensureRoleRecord(role, profile.id, groupId);
    console.log(`Seeded ${role}: ${name} <${normalizedEmail}>`);
    return profile.id;
};

const seedDemoData = async () => {
    if (!DEMO_PASSWORD || !validatePassword(DEMO_PASSWORD)) {
        throw new Error(`Set SEED_PASSWORD to a value with at least ${MIN_PASSWORD_LENGTH} characters before seeding demo data.`);
    }
    console.log("\nUsing built-in demo data. Newly created accounts use the local SEED_PASSWORD.\n");
    const mentorIds = new Map<string, number>();

    for (const mentor of demoMentors) {
        const profileId = await seedPerson("mentor", mentor.name, mentor.email, DEMO_PASSWORD);
        mentorIds.set(mentor.email.toLowerCase(), profileId);
    }

    const groupAssignments = [
        { name: "Group 115", mentorEmail: demoMentors[0].email },
        { name: "Group 116", mentorEmail: demoMentors[1].email },
    ];
    const groupIds = new Map<string, number>();

    for (const group of groupAssignments) {
        const mentorId = mentorIds.get(group.mentorEmail.toLowerCase());
        if (!mentorId) throw new Error(`Could not find the mentor for ${group.name}.`);
        const groupId = await ensureGroup(group.name, mentorId);
        if (groupId) groupIds.set(group.name, groupId);
    }

    for (const assistant of demoAssistants) {
        const groupId = groupIds.get(assistant.groupName) ?? null;
        await seedPerson("assistant", assistant.name, assistant.email, DEMO_PASSWORD, groupId);
    }

    for (const student of demoStudents) {
        const groupId = groupIds.get(student.groupName) ?? null;
        await seedPerson("student", student.name, student.email, DEMO_PASSWORD, groupId);
    }

    console.log("\nDemo data seeded. No password was printed.\n");
};

const seedRole = async (role: SeedRole, label: string) => {
    const shouldSeed = await askYesNo(`Seed ${label}s?`);
    if (!shouldSeed) {
        console.log(`Skipping ${label}s.`);
        return;
    }

    const count = Number.parseInt(await ask(`How many ${label}s do you want to add?`, "1"), 10);
    if (Number.isNaN(count) || count <= 0) {
        console.log(`Invalid count for ${label}s.`);
        return;
    }

    const groupName = await ask(`Optional group name for these ${label}s (leave blank to skip):`, "");

    let defaultGroupId: number | null = null;
    if (groupName) {
        const mentorRow = await db.select().from(mentors).limit(1);
        defaultGroupId = await ensureGroup(groupName, mentorRow[0]?.profileId);
    }

    for (let index = 0; index < count; index += 1) {
        const raw = await ask(`Enter ${label} ${index + 1} as "name,email,password"`);
        const values = parseSeedEntries(raw);

        if (values.length < 3) {
            console.log(`Invalid entry for ${label}. Expected: name,email,password`);
            continue;
        }

        const [name, email, password] = values;

        if (!validatePassword(password)) {
            console.log(`Invalid password for ${label} ${index + 1}. Use at least ${MIN_PASSWORD_LENGTH} characters, for example: StrongPassword123!`);
            continue;
        }

        await seedPerson(role, name, email, password, defaultGroupId);
    }
};

const main = async () => {
    console.log("\n--- Seed Academy Data ---\n");

    if (await askYesNo("Use built-in demo data?")) {
        await seedDemoData();
        rl.close();
        return;
    }

    await seedRole("mentor", "mentor");
    await seedRole("assistant", "assistant");
    await seedRole("student", "student");

    console.log("\nSeeding complete.\n");
    rl.close();
};

main().catch((error) => {
    console.error("Seed failed:", error);
    rl.close();
    process.exit(1);
});