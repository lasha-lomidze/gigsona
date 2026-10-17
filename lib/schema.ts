
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, integer, date, primaryKey } from "drizzle-orm/pg-core";
import { Role, ProfileStatus, AuraCategory, GroupAccessMode, GroupMemberRole } from "../types/types";

export const users = pgTable("users", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
});

export const sessions = pgTable(
    "sessions",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at").notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
    },
    (table) => [index("session_userId_idx").on(table.userId)],
);

export const accounts = pgTable(
    "accounts",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("account_userId_idx").on(table.userId)],
);

export const verifications = pgTable(
    "verifications",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const profiles = pgTable(
    "profiles",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        userId: text("user_id").unique().references(() => users.id, { onDelete: "cascade" }),
        email: text("email").unique(),
        firstName: text("first_name"),
        lastName: text("last_name"),
        displayName: text("display_name"),
        role: text("role").$type<Role>().default("anonymous").notNull(),
        status: text("status").$type<ProfileStatus>().default("active").notNull(),
        avatarUrl: text("avatar_url"),
        avatarId: text("avatar_id"),
        bio: text("bio"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("profile_userId_idx").on(table.userId)],
);

export const mentors = pgTable("mentors", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    profileId: integer("profile_id").notNull().unique().references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title"),
    bio: text("bio"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assistants = pgTable("assistants", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    profileId: integer("profile_id").notNull().unique().references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groups = pgTable("groups", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull().unique(),
    accessMode: text("access_mode").$type<GroupAccessMode>().default("free").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Staff membership: a group can have several owners and several assistants,
// and a profile can staff several groups.
export const groupMembers = pgTable("group_members", {
    groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
    profileId: integer("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    role: text("role").$type<GroupMemberRole>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    primaryKey({ columns: [table.groupId, table.profileId] }),
    index("group_members_profile_idx").on(table.profileId),
    index("group_members_group_role_idx").on(table.groupId, table.role),
]);

export const students = pgTable("students", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    profileId: integer("profile_id").notNull().unique().references(() => profiles.id, { onDelete: "cascade" }),
    groupId: integer("group_id").references(() => groups.id, { onDelete: "set null" }),
    status: text("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auras = pgTable("auras", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    giverId: text("giver_id").references(() => users.id, { onDelete: "set null" }),
    receiverId: integer("receiver_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    category: text("category").$type<AuraCategory>().notNull(),
    aura: integer("aura").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailyAuraChanges = pgTable("daily_aura_changes", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
    studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    lessonDate: date("lesson_date", { mode: "string" }).notNull(),
    category: text("category").$type<AuraCategory>().notNull(),
    studentName: text("student_name"),
    previousAura: integer("previous_aura").notNull(),
    newAura: integer("new_aura").notNull(),
    operationId: text("operation_id"),
    changedBy: text("changed_by").references(() => users.id, { onDelete: "set null" }),
    isUndo: boolean("is_undo").default(false).notNull(),
    undoesOperationId: text("undoes_operation_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("daily_aura_lesson_date_idx").on(table.lessonDate),
    index("daily_aura_group_date_idx").on(table.groupId, table.lessonDate),
    index("daily_aura_score_history_idx").on(table.groupId, table.lessonDate, table.studentId, table.category, table.id),
    index("daily_aura_operation_idx").on(table.operationId),
    index("daily_aura_undo_target_idx").on(table.undoesOperationId),
]);

export const userRelations = relations(users, ({ many, one }) => ({
    sessions: many(sessions),
    accounts: many(accounts),
    profile: one(profiles, {
        fields: [users.id],
        references: [profiles.userId],
    }),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

export const accountRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
}));

export const profileRelations = relations(profiles, ({ one, many }) => ({
    user: one(users, {
        fields: [profiles.userId],
        references: [users.id],
    }),
    mentor: one(mentors, {
        fields: [profiles.id],
        references: [mentors.profileId],
    }),
    assistant: one(assistants, {
        fields: [profiles.id],
        references: [assistants.profileId],
    }),
    student: one(students, {
        fields: [profiles.id],
        references: [students.profileId],
    }),
    groupMemberships: many(groupMembers),
}));

export const mentorRelations = relations(mentors, ({ one }) => ({
    profile: one(profiles, {
        fields: [mentors.profileId],
        references: [profiles.id],
    }),
}));

export const assistantRelations = relations(assistants, ({ one }) => ({
    profile: one(profiles, {
        fields: [assistants.profileId],
        references: [profiles.id],
    }),
}));

export const groupMemberRelations = relations(groupMembers, ({ one }) => ({
    group: one(groups, {
        fields: [groupMembers.groupId],
        references: [groups.id],
    }),
    profile: one(profiles, {
        fields: [groupMembers.profileId],
        references: [profiles.id],
    }),
}));

export const groupRelations = relations(groups, ({ many }) => ({
    members: many(groupMembers),
    students: many(students),
}));

export const studentRelations = relations(students, ({ one, many }) => ({
    profile: one(profiles, {
        fields: [students.profileId],
        references: [profiles.id],
    }),
    group: one(groups, {
        fields: [students.groupId],
        references: [groups.id],
    }),
    receivedAuras: many(auras, { relationName: "receivedAuras" }),
}));

export const auraRelations = relations(auras, ({ one }) => ({
    receiver: one(students, {
        fields: [auras.receiverId],
        references: [students.id],
        relationName: "receivedAuras",
    }),
    giver: one(users, {
        fields: [auras.giverId],
        references: [users.id],
    }),
}));
