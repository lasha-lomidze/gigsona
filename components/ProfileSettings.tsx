"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { FiCheck, FiChevronDown, FiSave } from "react-icons/fi";
import { saveProfileNameAction } from "@/actions/profile";
import { getAvatarById, PRESET_AVATARS } from "@/lib/avatars";
import type { MessageKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/use-t";
import { categoryLabelKey, type ProfileAuraStats, type StudentLeaderboardRanks } from "@/lib/aura-stats-shared";
import { AuraInsights, TotalAuraBadge } from "@/components/AuraInsights";
import { CategoryRadar, TrendBars } from "@/components/AuraCharts";
import type { ProfileStatus, Role } from "@/types/types";
import { roleChip } from "@/lib/ui";
import { StudentProfileHighlights } from "@/components/StudentProfileHighlights";

type ProfileState = { status: "idle" | "success" | "error"; message: string; savedName?: string; savedAvatarId?: string | null; savedBio?: string };
const initialState: ProfileState = { status: "idle", message: "" };

const initialsFor = (name: string) =>
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";

const ROLE_LABEL_KEYS = {
    anonymous: "labels.role.anonymous",
    student: "labels.role.student",
    mentor: "labels.role.mentor",
    assistant: "labels.role.assistant",
} as const satisfies Record<Role, MessageKey>;

const STATUS_LABEL_KEYS = {
    active: "labels.status.active",
    inactive: "labels.status.inactive",
} as const satisfies Record<ProfileStatus, MessageKey>;

const AVATAR_GROUP_LABEL_KEYS = {
    lorelei: "settings.profile.avatarGroup.people",
    bottts: "settings.profile.avatarGroup.bots",
    pixelbot: "settings.profile.avatarGroup.pixelBots",
    shapes: "settings.profile.avatarGroup.shapes",
    blobs: "settings.profile.avatarGroup.blobs",
    planets: "settings.profile.avatarGroup.planets",
    constellation: "settings.profile.avatarGroup.constellations",
} as const satisfies Record<string, MessageKey>;

const PROFILE_MESSAGE_KEYS = {
    "Sign in to edit your profile.": "settings.profile.message.signInToEdit",
    "Display name must be between 2 and 40 characters.": "settings.profile.message.displayNameLength",
    "Choose a valid avatar.": "settings.profile.message.chooseValidAvatar",
    "Profile saved.": "settings.profile.message.profileSaved",
    "Could not save your profile.": "settings.profile.message.couldNotSave",
} as const satisfies Record<string, MessageKey>;

type AvatarGroupId = keyof typeof AVATAR_GROUP_LABEL_KEYS;
type ProfileMessageText = keyof typeof PROFILE_MESSAGE_KEYS;

export function ProfileSettings({
    initialName,
    initialAvatarId,
    initialBio,
    email,
    role,
    status,
    groupNames,
    studentGroup,
    studentRanks,
    auraStats,
}: {
    initialName: string;
    initialAvatarId: string | null;
    initialBio: string;
    email: string;
    role: Role;
    status: ProfileStatus;
    groupNames: string[];
    studentGroup: { id: number; name: string } | null;
    studentRanks: StudentLeaderboardRanks | null;
    auraStats: ProfileAuraStats | null;
}) {
    const t = useT();
    const [displayName, setDisplayName] = useState(initialName);
    const [avatarId, setAvatarId] = useState<string | null>(initialAvatarId);
    const [bio, setBio] = useState(initialBio);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [state, formAction, pending] = useActionState(saveProfileNameAction, initialState);

    const savedName = state.savedName ?? initialName;
    const savedAvatarId = state.savedAvatarId !== undefined ? state.savedAvatarId : initialAvatarId;
    const savedBio = state.savedBio ?? initialBio;
    const dirty = displayName.trim() !== savedName || avatarId !== savedAvatarId || bio.trim() !== savedBio;

    const selectedAvatar = useMemo(() => getAvatarById(avatarId), [avatarId]);
    const resolvedName = displayName || t("settings.profile.nameFallback");
    const stateMessage = state.message in PROFILE_MESSAGE_KEYS
        ? t(PROFILE_MESSAGE_KEYS[state.message as ProfileMessageText])
        : state.message;

    const groups = useMemo(() => {
        const map = new Map<string, typeof PRESET_AVATARS>();
        for (const avatar of PRESET_AVATARS) {
            const list = map.get(avatar.group) ?? [];
            list.push(avatar);
            map.set(avatar.group, list);
        }
        return [...map.entries()];
    }, []);

    const avatarGroupLabel = (group: string) =>
        group in AVATAR_GROUP_LABEL_KEYS ? t(AVATAR_GROUP_LABEL_KEYS[group as AvatarGroupId]) : group;

    const avatarLabel = (avatar: { group: string; id: string }) =>
        t("settings.profile.avatarLabel", {
            group: avatarGroupLabel(avatar.group),
            number: avatar.id.replace(/^[a-z]+/, ""),
        });

    return (
        <div className="pb-10">
            <section className="flex flex-wrap items-center gap-5 border-y border-line py-5 sm:gap-6">
                {selectedAvatar ? (
                    <span className={`grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border sm:size-24 ${roleChip[role]}`}>
                        <Image src={selectedAvatar.src} alt={avatarLabel(selectedAvatar)} width={96} height={96} className="size-full object-cover" unoptimized loading="eager" priority />
                    </span>
                ) : (
                    <span aria-label={t("settings.profile.initialsAria", { name: resolvedName })} className={`grid size-20 shrink-0 place-items-center rounded-full border text-2xl font-semibold tracking-wide sm:size-24 sm:text-3xl ${roleChip[role]}`}>
                        {initialsFor(displayName)}
                    </span>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-accent">{t("settings.profile.section.identity")}</p>
                    <h2 className="mt-1 truncate text-2xl font-semibold text-ink">{resolvedName}</h2>
                    {bio.trim() ? <p className="mt-1 line-clamp-2 text-sm text-muted">{bio}</p> : <p className="mt-1 truncate text-sm text-faint">{email}</p>}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${roleChip[role]}`}>{t(ROLE_LABEL_KEYS[role])}</span>
                        <span className={`rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${status === "active" ? "border-ok/20 bg-ok/5 text-ok" : "border-danger/20 bg-danger/5 text-danger"}`}>{t(STATUS_LABEL_KEYS[status])}</span>
                    </div>
                </div>
                {auraStats && <TotalAuraBadge total={auraStats.totalAura} label={auraStats.kind === "student" ? t("settings.profile.totalAura") : t("settings.profile.groupAura")} />}
            </section>

            <div className="mt-6 grid gap-8 lg:grid-cols-2">
                <form action={formAction} className="min-w-0">
                    {role === "student" && (
                        <section className="mb-6">
                            <h3 className="text-sm font-semibold text-ink">{t("settings.profile.studentStandings")}</h3>
                            <StudentProfileHighlights group={studentGroup} ranks={studentRanks} />
                        </section>
                    )}
                    <input type="hidden" name="avatarId" value={avatarId ?? ""} />

                    <label className="block text-xs font-medium text-muted">
                        {t("settings.profile.displayName")}
                        <input
                            name="displayName"
                            type="text"
                            required
                            minLength={2}
                            maxLength={40}
                            autoComplete="nickname"
                            value={displayName}
                            onChange={(event) => setDisplayName(event.target.value)}
                            className="mt-1.5 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                        />
                    </label>

                    <label className="mt-4 block text-xs font-medium text-muted">
                        {t("settings.profile.bio")}
                        <textarea
                            name="bio"
                            rows={2}
                            maxLength={160}
                            placeholder={t("settings.profile.bioPlaceholder")}
                            value={bio}
                            onChange={(event) => setBio(event.target.value)}
                            className="mt-1.5 w-full resize-none rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                        />
                    </label>
                    <p className="mt-1 text-right text-[10px] text-faint">{bio.length}/160</p>

                    <div className="mt-2 rounded-lg border border-line">
                        <button
                            type="button"
                            onClick={() => setPickerOpen((v) => !v)}
                            aria-expanded={pickerOpen}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                        >
                            <span className="flex items-center gap-2.5">
                                <span className={`grid size-8 place-items-center overflow-hidden rounded-md border ${selectedAvatar ? "border-line" : roleChip[role]}`}>
                                    {selectedAvatar
                                        ? <Image src={selectedAvatar.src} alt="" width={32} height={32} className="size-full object-cover" unoptimized />
                                        : <span className="text-xs font-semibold">{initialsFor(displayName)}</span>}
                                </span>
                                <span>
                                    <span className="block text-xs font-semibold text-ink">{t("settings.profile.avatar")}</span>
                                    <span className="block text-[10px] text-faint">{selectedAvatar ? avatarLabel(selectedAvatar) : t("settings.profile.initials")}</span>
                                </span>
                            </span>
                            <FiChevronDown className={`size-4 text-faint transition-transform ${pickerOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                        </button>

                        {pickerOpen && (
                            <div className="max-h-72 space-y-4 overflow-y-auto border-t border-line p-3">
                                <div>
                                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{t("settings.profile.initials")}</p>
                                    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                                        <button
                                            type="button"
                                            onClick={() => setAvatarId(null)}
                                            title={t("settings.profile.useInitials")}
                                            aria-pressed={avatarId === null}
                                            className={`relative grid aspect-square place-items-center rounded-md border text-sm font-semibold transition ${avatarId === null ? "border-accent ring-2 ring-accent/30 " + roleChip[role] : "border-line bg-canvas text-muted hover:border-neutral-600"}`}
                                        >
                                            {initialsFor(displayName)}
                                            {avatarId === null && (
                                                <span className="absolute right-0.5 top-0.5 grid size-3.5 place-items-center rounded-full bg-accent text-accent-ink">
                                                    <FiCheck className="size-2.5" aria-hidden="true" />
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {groups.map(([groupName, avatars]) => (
                                    <div key={groupName}>
                                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{avatarGroupLabel(groupName)}</p>
                                        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                                            {avatars.map((avatar) => {
                                                const selected = avatarId === avatar.id;
                                                return (
                                                    <button
                                                        key={avatar.id}
                                                        type="button"
                                                        onClick={() => setAvatarId(selected ? null : avatar.id)}
                                                        title={avatarLabel(avatar)}
                                                        aria-pressed={selected}
                                                        className={`relative grid aspect-square place-items-center overflow-hidden rounded-md border transition ${selected ? "border-accent ring-2 ring-accent/30" : "border-line bg-canvas hover:border-neutral-600"}`}
                                                    >
                                                        <Image src={avatar.src} alt={avatarLabel(avatar)} width={40} height={40} className="size-full object-cover" unoptimized />
                                                        {selected && (
                                                            <span className="absolute right-0.5 top-0.5 grid size-3.5 place-items-center rounded-full bg-accent text-accent-ink">
                                                                <FiCheck className="size-2.5" aria-hidden="true" />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-line pt-4">
                        <button type="submit" disabled={pending || !dirty} className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50">
                            {state.status === "success" && !dirty ? <FiCheck aria-hidden="true" /> : <FiSave aria-hidden="true" />}
                            {pending ? t("settings.profile.save.pending") : state.status === "success" && !dirty ? t("settings.profile.save.saved") : t("settings.profile.save.button")}
                        </button>
                        {state.message && (state.status === "error" || !dirty) && <p role={state.status === "error" ? "alert" : "status"} className={`text-sm ${state.status === "error" ? "text-danger" : "text-ok"}`}>{stateMessage}</p>}
                    </div>
                </form>

                <div className="min-w-0 lg:border-l lg:border-line lg:pl-8">
                    {auraStats ? (
                        <div className="space-y-4">
                            <div className="flex items-baseline justify-between gap-3">
                                <h3 className="text-sm font-semibold text-ink">
                                    {auraStats.kind === "student" ? t("settings.profile.auraTitle.student") : t("settings.profile.auraTitle.group")}
                                </h3>
                                {auraStats.kind !== "student" && groupNames.length > 0 && (
                                    <p className="truncate text-[10px] uppercase tracking-wider text-faint">{groupNames.join(", ")}</p>
                                )}
                            </div>
                            <AuraInsights stats={auraStats} />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border border-line bg-canvas p-3">
                                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{t("settings.profile.byCategory")}</p>
                                    {auraStats.categoryTotals.length ? <CategoryRadar data={auraStats.categoryTotals} /> : <p className="py-10 text-center text-xs text-faint">{t("settings.profile.noAuraYet")}</p>}
                                </div>
                                <div className="rounded-lg border border-line bg-canvas p-3">
                                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{t("settings.profile.last7Days")}</p>
                                    <TrendBars data={auraStats.trend} />
                                </div>
                            </div>
                            {auraStats.categoryTotals.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {auraStats.categoryTotals.map((c) => (
                                        <span key={c.category} className="rounded-sm border border-line px-2 py-1 text-[10px] text-muted">
                                            {t(categoryLabelKey(c.category))} <span className="font-semibold text-ink">{c.total}</span>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-ink">{t("settings.profile.academyDetails")}</h3>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{t("settings.profile.signInEmail")}</p>
                                <p className="mt-1 break-all text-sm text-muted">{email}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{t("settings.profile.groups")}</p>
                                {groupNames.length ? (
                                    <ul className="mt-2 flex flex-wrap gap-1.5">
                                        {groupNames.map((groupName) => <li key={groupName} className="rounded-sm border border-line px-2 py-1 text-xs text-muted">{groupName}</li>)}
                                    </ul>
                                ) : <p className="mt-1 text-sm text-faint">{t("settings.profile.noGroupAssigned")}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}