export const THEME_COOKIE_NAME = "gigsona:theme";
export const THEME_STORAGE_KEY = "gigsona:theme";

export const THEME_OPTIONS = [
    { id: "dark", labelKey: "settings.theme.dark", hintKey: "settings.theme.darkHint" },
    { id: "light", labelKey: "settings.theme.light", hintKey: "settings.theme.lightHint" },
    { id: "system", labelKey: "settings.theme.system", hintKey: "settings.theme.systemHint" },
] as const;

export type ThemePreference = (typeof THEME_OPTIONS)[number]["id"];
export type ResolvedTheme = "dark" | "light";

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "dark";

export function parseThemePreference(value: string | null | undefined): ThemePreference {
    return THEME_OPTIONS.find((option) => option.id === value)?.id ?? DEFAULT_THEME_PREFERENCE;
}

export function getSystemTheme(): ResolvedTheme {
    if (typeof window === "undefined" || !window.matchMedia) {
        return "dark";
    }
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
    if (preference === "system") {
        return getSystemTheme();
    }
    return preference;
}

export function getThemeOption(id: ThemePreference) {
    return THEME_OPTIONS.find((option) => option.id === id) ?? THEME_OPTIONS[0];
}

export function applyTheme(preference: ThemePreference, resolved: ResolvedTheme) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    root.dataset.themePreference = preference;

    if (resolved === "light") {
        root.classList.add("light");
        root.classList.remove("dark");
        root.style.colorScheme = "light";
    } else {
        root.classList.add("dark");
        root.classList.remove("light");
        root.style.colorScheme = "dark";
    }
}
