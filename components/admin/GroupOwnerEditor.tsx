"use client";

import { useActionState, useState } from "react";
import { assignGroupMentorAction, updateGroupAction } from "@/app/admin/group-actions";
import { useT } from "@/lib/i18n/use-t";
import { initialState, type Group, type Person } from "./config";
import { Feedback, Field, fieldClass } from "./shared";

interface GroupOwnerEditorProps {
    group: Group;
    mentors: Person[];
    studentCount: number;
    assistantCount: number;
}

export function GroupOwnerEditor({
    group,
    mentors,
    studentCount,
    assistantCount,
}: GroupOwnerEditorProps) {
    const [open, setOpen] = useState(false);
    const [detailsState, detailsAction, detailsPending] = useActionState(updateGroupAction, initialState);
    const [state, action, pending] = useActionState(assignGroupMentorAction, initialState);
    const t = useT();

    return (
        <article className="border-b border-line py-4 last:border-b-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-ink">{group.name}</h3>
                    <p className="mt-1 text-xs text-faint">
                        {group.ownerMentorIds.length > 1 ? t("admin.group.owners") : t("admin.group.ownedBy")}{" "}
                        <span className="text-muted">{group.mentorName || t("admin.group.noOwner")}</span>
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span>{t("admin.group.studentsCount", { count: studentCount })}</span>
                    <span>{t("admin.group.assistantsCount", { count: assistantCount })}</span>
                    <span>{group.accessMode === "locked" ? t("admin.common.locked") : t("admin.common.free")}</span>
                    <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpen(!open)}
                        className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${open ? "border-accent/40 bg-accent/8 text-lime-200" : "border-line text-muted hover:border-neutral-500 hover:text-ink"}`}
                    >
                        {open ? t("admin.common.close") : t("admin.common.edit")}
                    </button>
                </div>
            </div>
            {open && (
                <div className="mt-3 space-y-3">
                    <form action={detailsAction} className="grid gap-3 rounded-md border border-line bg-canvas/60 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                        <input type="hidden" name="groupId" value={group.id} />
                        <Field label={t("admin.common.groupName")}>
                            <input name="name" required minLength={2} defaultValue={group.name} className={fieldClass} />
                        </Field>
                        <fieldset className="min-w-0">
                            <legend className="text-xs font-medium text-muted">{t("admin.common.access")}</legend>
                            <div className="mt-1.5 flex h-11 items-center gap-4 rounded-md border border-line bg-canvas px-3">
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                                    <input type="radio" name="accessMode" value="free" defaultChecked={group.accessMode === "free"} className="accent-lime-300" />
                                    {t("admin.common.free")}
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                                    <input type="radio" name="accessMode" value="locked" defaultChecked={group.accessMode === "locked"} className="accent-rose-300" />
                                    {t("admin.common.locked")}
                                </label>
                            </div>
                        </fieldset>
                        <button type="submit" disabled={detailsPending} className="btn btn-primary h-11">
                            {detailsPending ? t("admin.common.saving") : t("admin.common.saveGroup")}
                        </button>
                        <div className="sm:col-span-3"><Feedback state={detailsState} /></div>
                    </form>
                    <form action={action} className="grid gap-3 rounded-md border border-line bg-canvas/60 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                        <input type="hidden" name="groupId" value={group.id} />
                        <fieldset className="min-w-0">
                            <legend className="mb-2 text-xs font-medium text-muted">{t("admin.group.ownersMinimumOne")}</legend>
                            <div className="flex flex-wrap gap-2">
                                {mentors.filter((mentor) => mentor.status === "active" || group.ownerMentorIds.includes(mentor.id)).map((mentor) => (
                                    <label key={mentor.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-2.5 py-1.5 text-sm text-ink has-checked:border-accent/40 has-checked:bg-accent/8">
                                        <input type="checkbox" name="mentorIds" value={mentor.id} defaultChecked={group.ownerMentorIds.includes(mentor.id)} className="accent-lime-300" />
                                        {mentor.name || t("admin.common.unnamedMentor")}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <button type="submit" disabled={pending} className="btn btn-primary h-11">
                            {pending ? t("admin.common.saving") : t("admin.common.saveOwners")}
                        </button>
                        <div className="sm:col-span-2"><Feedback state={state} /></div>
                    </form>
                </div>
            )}
        </article>
    );
}
