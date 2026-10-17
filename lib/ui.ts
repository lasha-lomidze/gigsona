import type { ProfileStatus, Role } from "@/types/types";

export const roleChip: Record<Role, string> = {
    anonymous: "border-line bg-surface-2 text-ink",
    student: "border-accent/25 bg-accent/10 text-lime-100",
    assistant: "border-sky-300/25 bg-sky-300/10 text-sky-100",
    mentor: "border-violet-300/25 bg-violet-300/10 text-violet-100",
};

export const statusChip: Record<ProfileStatus | "unassigned", string> = {
    active: "border-ok/20 bg-ok/10 text-ok",
    inactive: "border-danger/20 bg-danger/10 text-danger",
    unassigned: "border-amber-300/20 bg-amber-300/10 text-amber-200",
};
