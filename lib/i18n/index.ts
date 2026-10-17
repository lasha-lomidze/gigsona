import { REGION_OPTIONS } from "@/lib/region";
import { en as enAdmin, ka as kaAdmin } from "./messages/admin";
import { en as enAuth, ka as kaAuth } from "./messages/auth";
import { en as enErrors, ka as kaErrors } from "./messages/errors";
import { en as enHistory, ka as kaHistory } from "./messages/history";
import { en as enLabels, ka as kaLabels } from "./messages/labels";
import { en as enManage, ka as kaManage } from "./messages/manage";
import { en as enOverview, ka as kaOverview } from "./messages/overview";
import { en as enProfile, ka as kaProfile } from "./messages/profile";
import { en as enSearch, ka as kaSearch } from "./messages/search";
import { en as enSettings, ka as kaSettings } from "./messages/settings";
import { en as enShell, ka as kaShell } from "./messages/shell";

const en = {
    ...enAdmin,
    ...enAuth,
    ...enErrors,
    ...enHistory,
    ...enLabels,
    ...enManage,
    ...enOverview,
    ...enProfile,
    ...enSearch,
    ...enSettings,
    ...enShell,
};

export type MessageKey = keyof typeof en;

const ka: Record<MessageKey, string> = {
    ...kaAdmin,
    ...kaAuth,
    ...kaErrors,
    ...kaHistory,
    ...kaLabels,
    ...kaManage,
    ...kaOverview,
    ...kaProfile,
    ...kaSearch,
    ...kaSettings,
    ...kaShell,
};

type Locale = (typeof REGION_OPTIONS)[number]["locale"];

const dictionaries: Record<Locale, Record<MessageKey, string>> = {
    "ka-GE": ka,
    "en-GB": en,
};

export type TranslateValues = Record<string, string | number>;

export function translate(locale: string, key: MessageKey, values?: TranslateValues): string {
    const template: string = (dictionaries[locale as Locale] ?? en)[key];
    if (!values) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in values ? String(values[name]) : match,
    );
}
