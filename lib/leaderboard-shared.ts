export type LeaderboardStudent = {
    studentId: number;
    profileId: number;
    groupId: number | null;
    groupName: string | null;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    avatarId: string | null;
    avatarUrl: string | null;
    totalAura: number;
    activeDays: number;
    globalRank: number;
    groupRank: number;
};

export type LeaderboardGroup = {
    id: number;
    name: string;
    studentCount: number;
};

export type LeaderboardData = {
    students: LeaderboardStudent[];
    groups: LeaderboardGroup[];
    topAura: number;
    totalStudents: number;
    totalGroups: number;
};
