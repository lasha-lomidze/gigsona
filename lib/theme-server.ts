import "server-only";
import { cookies } from "next/headers";
import {
    parseThemePreference,
    THEME_COOKIE_NAME,
    type ThemePreference,
} from "@/lib/theme";

export async function getThemePreference(): Promise<ThemePreference> {
    const store = await cookies();
    return parseThemePreference(store.get(THEME_COOKIE_NAME)?.value ?? null);
}
