"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import {
    applyDisplayScale,
    DEFAULT_DISPLAY_SCALE,
    DISPLAY_SCALE_OPTIONS,
    DISPLAY_SCALE_STORAGE_KEY,
    getDisplayScaleOption,
    parseDisplayScale,
    type DisplayScaleId,
} from "@/lib/display-scale";
import { useT } from "@/lib/i18n/use-t";

type DisplayScaleContextValue = {
    displayScale: DisplayScaleId;
    setDisplayScale: (id: DisplayScaleId) => void;
};

const DisplayScaleContext = createContext<DisplayScaleContextValue | null>(null);
const DISPLAY_SCALE_CHANGE_EVENT = "gigsona:display-scale-change";

function subscribeToDisplayScale(onChange: () => void) {
    window.addEventListener("storage", onChange);
    window.addEventListener(DISPLAY_SCALE_CHANGE_EVENT, onChange);
    return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(DISPLAY_SCALE_CHANGE_EVENT, onChange);
    };
}

function getDisplayScaleSnapshot() {
    return parseDisplayScale(window.localStorage.getItem(DISPLAY_SCALE_STORAGE_KEY));
}

function getServerDisplayScaleSnapshot() {
    return DEFAULT_DISPLAY_SCALE;
}

export function DisplayScaleProvider({ children }: { children: ReactNode }) {
    const displayScale = useSyncExternalStore(
        subscribeToDisplayScale,
        getDisplayScaleSnapshot,
        getServerDisplayScaleSnapshot,
    );

    useEffect(() => {
        applyDisplayScale(displayScale);
    }, [displayScale]);

    function setDisplayScale(id: DisplayScaleId) {
        window.localStorage.setItem(DISPLAY_SCALE_STORAGE_KEY, id);
        applyDisplayScale(id);
        window.dispatchEvent(new Event(DISPLAY_SCALE_CHANGE_EVENT));
    }

    return (
        <DisplayScaleContext.Provider value={{ displayScale, setDisplayScale }}>
            {children}
        </DisplayScaleContext.Provider>
    );
}

export function DisplayScaleSetting() {
    const t = useT();
    const context = useContext(DisplayScaleContext);
    if (!context) {
        throw new Error("DisplayScaleSetting must be used within DisplayScaleProvider.");
    }

    const { displayScale, setDisplayScale } = context;
    const selectedOption = getDisplayScaleOption(displayScale);

    return (
        <section className="panel max-w-2xl p-5" aria-labelledby="display-size-title">
            <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 id="display-size-title" className="text-base font-semibold text-ink">
                            {t("settings.display.title")}
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                            {t("settings.display.description")}
                        </p>
                    </div>
                    <span className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-lime-200">
                        {t(selectedOption.labelKey)}
                    </span>
                </div>

                <div
                    className="grid grid-cols-3 gap-2 sm:grid-cols-5"
                    role="radiogroup"
                    aria-label={t("settings.display.aria.choose")}
                >
                    {DISPLAY_SCALE_OPTIONS.map((option, index) => {
                        const selected = option.id === displayScale;
                        return (
                            <button
                                key={option.id}
                                id={`display-scale-${option.id}`}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                tabIndex={selected ? 0 : -1}
                                onClick={() => setDisplayScale(option.id)}
                                onKeyDown={(event) => {
                                    const direction = event.key === "ArrowRight" || event.key === "ArrowDown"
                                        ? 1
                                        : event.key === "ArrowLeft" || event.key === "ArrowUp"
                                            ? -1
                                            : 0;
                                    if (!direction) return;
                                    event.preventDefault();
                                    const next = DISPLAY_SCALE_OPTIONS[
                                        (index + direction + DISPLAY_SCALE_OPTIONS.length) %
                                        DISPLAY_SCALE_OPTIONS.length
                                    ];
                                    if (next) {
                                        setDisplayScale(next.id);
                                        document.getElementById(`display-scale-${next.id}`)?.focus();
                                    }
                                }}
                                className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-line bg-canvas px-2 py-2 text-center text-xs text-muted transition-colors hover:border-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-checked:border-accent/60 aria-checked:bg-accent/10 aria-checked:text-lime-500"
                            >
                                <span className="font-medium">{t(option.labelKey)}</span>
                                <span className="text-[10px] text-faint">
                                    {Math.round(Number(option.zoom) * 100)}%
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}