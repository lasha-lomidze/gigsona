import type { ReactNode } from "react";
import { useT } from "@/lib/i18n/use-t";
import type { ActionState, AdminRole, Person } from "./config";
import { roleLabelKeys, statusLabelKeys } from "./config";

export const fieldClass = "field mt-1.5";
export const selectClass = `${fieldClass} appearance-none`;

const staticActionMessageKeys = {
    "Choose a valid person and role.": "admin.feedback.invalidPersonRole",
    "That academy profile could not be found.": "admin.feedback.profileNotFound",
    "Assistants cannot manage or assign mentor roles.": "admin.feedback.assistantsCannotManageMentorRoles",
    "Choose a valid group.": "admin.feedback.invalidGroup",
    "Choose valid groups.": "admin.feedback.invalidGroups",
    "One or more selected groups no longer exist.": "admin.feedback.selectedGroupsMissing",
    "No changes to save.": "admin.feedback.noChangesToSave",
    "Add another active mentor before changing the last mentor's role.": "admin.feedback.addAnotherMentorForRoleChange",
    "Could not change this role.": "admin.feedback.couldNotChangeRole",
    "Choose a valid profile status.": "admin.feedback.invalidProfileStatus",
    "Assistants cannot change mentor status.": "admin.feedback.assistantsCannotChangeMentorStatus",
    "Add another active mentor before deactivating the last mentor.": "admin.feedback.addAnotherMentorBeforeDeactivating",
    "Could not change this profile status.": "admin.feedback.couldNotChangeProfileStatus",
    "Choose a valid academy role.": "admin.feedback.invalidAcademyRole",
    "Assistants cannot assign mentor roles.": "admin.feedback.assistantsCannotAssignMentorRoles",
    "Assistants cannot assign assistants to groups.": "admin.feedback.assistantsCannotAssignAssistantGroups",
    "Select an existing account.": "admin.feedback.selectExistingAccount",
    "That account could not be found.": "admin.feedback.accountNotFound",
    "This profile is inactive. Reactivate it before changing its role.": "admin.feedback.profileInactiveBeforeRoleChange",
    "This profile already has a different role.": "admin.feedback.profileAlreadyDifferentRole",
    "Enter a name and a valid email address.": "admin.feedback.enterNameAndValidEmail",
    "An account already uses that email. Choose Link existing account.": "admin.feedback.emailAlreadyUsed",
    "A profile is already reserved for that email.": "admin.feedback.profileAlreadyReserved",
    "Choose whether to link an account or reserve a profile.": "admin.feedback.chooseLinkOrReserve",
    "Enter a group name and choose a mentor.": "admin.feedback.enterGroupNameAndMentor",
    "Choose a valid group access mode.": "admin.feedback.invalidGroupAccessMode",
    "That mentor could not be found.": "admin.feedback.mentorNotFound",
    "A group already uses that name.": "admin.feedback.groupNameInUse",
    "Enter a valid group name.": "admin.feedback.enterValidGroupName",
    "Choose at least one active mentor to own the group.": "admin.feedback.chooseActiveMentorOwner",
    "Every owner must be an active mentor.": "admin.feedback.everyOwnerMustBeActiveMentor",
    "Group owners updated.": "admin.feedback.groupOwnersUpdated",
    "Could not change this group's owners.": "admin.feedback.couldNotChangeGroupOwners",
} as const;

export function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="block min-w-0 text-xs font-medium text-muted">
            {label}
            {children}
        </label>
    );
}

function translateRole(role: AdminRole, t: ReturnType<typeof useT>) {
    return t(roleLabelKeys[role]).toLowerCase();
}

function translateStatus(status: Person["status"], t: ReturnType<typeof useT>) {
    return t(statusLabelKeys[status]).toLowerCase();
}

function translateFeedbackName(name: string, t: ReturnType<typeof useT>) {
    return name === "Profile" ? t("admin.feedback.profileFallback") : name;
}

function translateActionMessage(message: string, t: ReturnType<typeof useT>) {
    if (!message) return message;

    const staticKey = staticActionMessageKeys[message as keyof typeof staticActionMessageKeys];
    if (staticKey) return t(staticKey);

    const roleChangeMatch = message.match(/^(.*) is now a (student|assistant|mentor)\.$/);
    if (roleChangeMatch) {
        const [, name, role] = roleChangeMatch;
        return t("admin.feedback.roleChanged", {
            name: translateFeedbackName(name, t),
            role: translateRole(role as AdminRole, t),
        });
    }

    const alreadyStatusMatch = message.match(/^Profile is already (active|inactive)\.$/);
    if (alreadyStatusMatch) {
        return t("admin.feedback.profileAlreadyStatus", {
            status: translateStatus(alreadyStatusMatch[1] as Person["status"], t),
        });
    }

    const profileStatusChangeMatch = message.match(/^(.*) (deactivated|reactivated)\.$/);
    if (profileStatusChangeMatch) {
        const [, name, state] = profileStatusChangeMatch;
        return t("admin.feedback.profileStatusChanged", {
            name: translateFeedbackName(name, t),
            status: state === "deactivated"
                ? t("admin.feedback.deactivated")
                : t("admin.feedback.reactivated"),
        });
    }

    const groupCreatedMatch = message.match(/^(.*) was created\.$/);
    if (groupCreatedMatch) {
        return t("admin.feedback.groupCreated", { name: groupCreatedMatch[1] });
    }

    const groupUpdatedMatch = message.match(/^(.*) was updated\.$/);
    if (groupUpdatedMatch) {
        return t("admin.feedback.groupUpdated", { name: groupUpdatedMatch[1] });
    }

    return message;
}

export function Feedback({ state }: { state: ActionState }) {
    const t = useT();
    if (!state.message) return null;
    return (
        <p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-danger" : "text-accent"}`}>
            {translateActionMessage(state.message, t)}
        </p>
    );
}
