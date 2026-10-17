import type { Role } from "@/types/types";

export type DirectoryView = "roster" | "accounts";
export type AdminRole = Exclude<Role, "anonymous">;
export type Account = { id: string; name: string; email: string };
export type Person = {
    id: number;
    profileId: number;
    name: string | null;
    email: string | null;
    userId: string | null;
    groupId?: number | null;
    groupIds?: number[];
    groupName?: string | null;
    groupNames?: string[];
    status: "active" | "inactive";
};
export type Group = {
    id: number;
    name: string;
    mentorId: number | null;
    accessMode: "free" | "locked";
    mentorName: string | null;
    ownerMentorIds: number[];
};
export type ScoringDay = { date: string; total: number; label: string };
export type ActionState = { status: "idle" | "success" | "error"; message: string };

export const initialState: ActionState = { status: "idle", message: "" };

export const tabConfig = {
    students: {
        role: "student",
        labelKey: "admin.tab.students",
        searchPlaceholderKey: "admin.search.placeholder.students",
        searchAriaKey: "admin.search.aria.students",
    },
    assistants: {
        role: "assistant",
        labelKey: "admin.tab.assistants",
        searchPlaceholderKey: "admin.search.placeholder.assistants",
        searchAriaKey: "admin.search.aria.assistants",
    },
    mentors: {
        role: "mentor",
        labelKey: "admin.tab.mentors",
        searchPlaceholderKey: "admin.search.placeholder.mentors",
        searchAriaKey: "admin.search.aria.mentors",
    },
    groups: {
        role: null,
        labelKey: "admin.tab.groups",
        searchPlaceholderKey: "admin.search.placeholder.groups",
        searchAriaKey: "admin.search.aria.groups",
    },
} as const;

export type RoleTab = keyof typeof tabConfig;
export const tabIds = Object.keys(tabConfig) as RoleTab[];

export const roleConfig = {
    student: {
        headingKey: "admin.assign.heading.student",
        instructionsKey: "admin.assign.instructions.student",
        useAsRoleKey: "admin.assign.useAsStudent",
    },
    assistant: {
        headingKey: "admin.assign.heading.assistant",
        instructionsKey: "admin.assign.instructions.assistant",
        useAsRoleKey: "admin.assign.useAsAssistant",
    },
    mentor: {
        headingKey: "admin.assign.heading.mentor",
        instructionsKey: "admin.assign.instructions.mentor",
        useAsRoleKey: "admin.assign.useAsMentor",
    },
} as const;

export const roleLabelKeys = {
    anonymous: "labels.role.anonymous",
    student: "labels.role.student",
    mentor: "labels.role.mentor",
    assistant: "labels.role.assistant",
} as const;

export const statusLabelKeys = {
    active: "labels.status.active",
    inactive: "labels.status.inactive",
} as const;

export const rosterConfig = {
    active: {
        students: {
            regionKey: "admin.directory.region.activeStudents",
            emptyKey: "admin.directory.empty.activeStudents",
        },
        assistants: {
            regionKey: "admin.directory.region.activeAssistants",
            emptyKey: "admin.directory.empty.activeAssistants",
        },
        mentors: {
            regionKey: "admin.directory.region.activeMentors",
            emptyKey: "admin.directory.empty.activeMentors",
        },
    },
    inactive: {
        students: {
            regionKey: "admin.directory.region.inactiveStudents",
            emptyKey: "admin.directory.empty.inactiveStudents",
        },
        assistants: {
            regionKey: "admin.directory.region.inactiveAssistants",
            emptyKey: "admin.directory.empty.inactiveAssistants",
        },
        mentors: {
            regionKey: "admin.directory.region.inactiveMentors",
            emptyKey: "admin.directory.empty.inactiveMentors",
        },
    },
} as const;

export function filterGroups(groups: Group[], query: string) {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
        ? groups.filter((group) => group.name.toLowerCase().includes(normalizedQuery))
        : groups;
}
