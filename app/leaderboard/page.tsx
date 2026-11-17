import type { Metadata } from "next";
import { getSessionProfile } from "@/lib/session-profile";
import { db } from "@/lib/db";
import { students } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { loadLeaderboardData } from "@/lib/leaderboard";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getT();
    return {
        title: `${t("leaderboard.page.title")} · ${t("shell.meta.title")}`,
        description: t("leaderboard.page.description"),
    };
}

export default async function LeaderboardPage() {
    const [{ profile }, leaderboardData] = await Promise.all([
        getSessionProfile(),
        loadLeaderboardData(),
    ]);

    let studentGroupId: number | null = null;
    let defaultTab = "global";

    if (profile?.profileId && profile.role === "student") {
        const [studentRow] = await db
            .select({ groupId: students.groupId })
            .from(students)
            .where(eq(students.profileId, profile.profileId));

        if (studentRow?.groupId) {
            studentGroupId = studentRow.groupId;
            // Default should be their group for students
            defaultTab = String(studentRow.groupId);
        }
    } else {
        // Default should be global for assistant, mentor, and anonymous accounts
        defaultTab = "global";
    }

    const currentProfileProp = profile?.profileId
        ? {
            id: profile.profileId,
            role: profile.role,
            studentGroupId,
        }
        : null;

    return (
        <LeaderboardClient
            initialData={leaderboardData}
            defaultTab={defaultTab}
            currentProfile={currentProfileProp}
        />
    );
}
