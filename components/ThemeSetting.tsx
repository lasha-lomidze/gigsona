"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    useSyncExternalStore,
    type ReactNode,
} from "react";
import { motion } from "motion/react";
import {
    applyTheme,
    DEFAULT_THEME_PREFERENCE,
    getThemeOption,
    getSystemTheme,
    resolveTheme,
    THEME_COOKIE_NAME,
    THEME_OPTIONS,
    THEME_STORAGE_KEY,
    type ResolvedTheme,
    type ThemePreference,
} from "@/lib/theme";
import { useT } from "@/lib/i18n/use-t";
import { FiMoon, FiSun, FiMonitor } from "react-icons/fi";

type ThemeContextValue = {
    themePreference: ThemePreference;
    resolvedTheme: ResolvedTheme;
    setThemePreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function subscribeToThemePreference(onChange: () => void) {
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
}

function readThemePreference(initialPreference: ThemePreference): ThemePreference {
    try {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        return THEME_OPTIONS.find((option) => option.id === stored)?.id ?? initialPreference;
    } catch {
        return initialPreference;
    }
}

function subscribeToSystemTheme(onChange: () => void) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
        if (document.documentElement.dataset.themePreference === "system") {
            const resolvedTheme = mediaQuery.matches ? "light" : "dark";
            switchThemeSmoothly(() => applyTheme("system", resolvedTheme));
        }
        onChange();
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
}

const getServerSystemTheme = (): ResolvedTheme => "dark";

/**
 * Triggers a smooth, non-violent color transition across the entire page.
 * Uses requestAnimationFrame to add a temporary transition class to <html>,
 * switches the theme tokens, and smoothly cleans up after the transition duration.
 */
function switchThemeSmoothly(applyFn: () => void) {
    if (typeof document === "undefined") {
        applyFn();
        return;
    }

    const root = document.documentElement;
    root.classList.add("theme-transitioning");

    // Force layout flush so transition class is active before values change
    void root.offsetHeight;

    applyFn();

    window.setTimeout(() => {
        root.classList.remove("theme-transitioning");
    }, 420);
}

export function ThemeProvider({
    initialPreference = DEFAULT_THEME_PREFERENCE,
    children,
}: {
    initialPreference?: ThemePreference;
    children: ReactNode;
}) {
    const [preferenceOverride, setPreferenceOverride] = useState<ThemePreference | null>(null);
    const getClientPreference = useCallback(
        () => readThemePreference(initialPreference),
        [initialPreference],
    );
    const getServerPreference = useCallback(() => initialPreference, [initialPreference]);
    const storedPreference = useSyncExternalStore(
        subscribeToThemePreference,
        getClientPreference,
        getServerPreference,
    );
    const themePreference = preferenceOverride ?? storedPreference;
    const systemTheme = useSyncExternalStore(subscribeToSystemTheme, getSystemTheme, getServerSystemTheme);
    const resolvedTheme = themePreference === "system" ? systemTheme : themePreference;

    useEffect(() => {
        applyTheme(themePreference, resolveTheme(themePreference));
    }, [themePreference]);

    function setThemePreference(preference: ThemePreference) {
        const nextResolved = resolveTheme(preference);

        setPreferenceOverride(preference);
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, preference);
        } catch {
            // The cookie remains the server-readable preference when localStorage is unavailable.
        }
        document.cookie = `${THEME_COOKIE_NAME}=${preference}; path=/; max-age=${THEME_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;

        switchThemeSmoothly(() => {
            applyTheme(preference, nextResolved);
        });
    }

    return (
        <ThemeContext.Provider value={{ themePreference, resolvedTheme, setThemePreference }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider.");
    }
    return context;
}

const themeIcons = {
    dark: FiMoon,
    light: FiSun,
    system: FiMonitor,
} as const;

export function ThemeSetting() {
    const t = useT();
    const { themePreference, setThemePreference } = useTheme();
    const selectedOption = getThemeOption(themePreference);

    return (
        <section className="panel max-w-2xl p-5" aria-labelledby="theme-title">
            <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 id="theme-title" className="text-base font-semibold text-ink">
                            {t("settings.theme.title")}
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                            {t("settings.theme.description")}
                        </p>
                    </div>
                    <span className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-lime-600">
                        {t(selectedOption.labelKey)}
                    </span>
                </div>

                <div
                    className="grid grid-cols-3 gap-2"
                    role="radiogroup"
                    aria-label={t("settings.theme.aria.choose")}
                >
                    {THEME_OPTIONS.map((option, index) => {
                        const selected = option.id === themePreference;
                        const Icon = themeIcons[option.id];
                        return (
                            <button
                                key={option.id}
                                id={`theme-${option.id}`}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                tabIndex={selected ? 0 : -1}
                                onClick={() => setThemePreference(option.id)}
                                onKeyDown={(event) => {
                                    const direction =
                                        event.key === "ArrowRight" || event.key === "ArrowDown"
                                            ? 1
                                            : event.key === "ArrowLeft" || event.key === "ArrowUp"
                                                ? -1
                                                : 0;
                                    if (!direction) return;
                                    event.preventDefault();
                                    const next =
                                        THEME_OPTIONS[
                                        (index + direction + THEME_OPTIONS.length) % THEME_OPTIONS.length
                                        ];
                                    if (next) {
                                        setThemePreference(next.id);
                                        document.getElementById(`theme-${next.id}`)?.focus();
                                    }
                                }}
                                className={`group relative flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-center text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] ${selected
                                    ? "border-transparent bg-accent/10 text-lime-700 dark:text-lime-400"
                                    : "border-line bg-canvas text-muted hover:border-neutral-500 hover:bg-surface/40"
                                    }`}
                            >
                                {selected && (
                                    <motion.div
                                        layoutId="theme-active-indicator"
                                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                                        className="absolute -inset-px rounded-xl border border-accent/60 pointer-events-none"
                                    />
                                )}
                                {selected && (
                                    <span className="absolute right-2 top-2 size-2 rounded-full bg-accent/80 ring-2 ring-canvas z-1" />
                                )}
                                <Icon className={`size-5 transition-transform duration-200 group-hover:scale-110 z-1 ${selected ? "text-lime-600 " : ""}`} aria-hidden="true" />
                                <span className="font-semibold text-ink z-1">{t(option.labelKey)}</span>
                                <span className={`text-[11px] z-1 ${selected ? "text-lime-600/80 " : "text-faint"}`}>{t(option.hintKey)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
