"use client";

import { createContext, startTransition, useContext, useOptimistic, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
    getRegionOption,
    REGION_COOKIE_NAME,
    REGION_OPTIONS,
    type RegionId,
} from "@/lib/region";
import { translate } from "@/lib/i18n";

type RegionContextValue = {
    region: RegionId;
    locale: string;
    setRegion: (id: RegionId) => void;
};

const RegionContext = createContext<RegionContextValue | null>(null);

const REGION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function RegionProvider({ initialRegion, children }: { initialRegion: RegionId; children: ReactNode }) {
    const router = useRouter();
    const [region, setOptimisticRegion] = useOptimistic(initialRegion);

    function setRegion(id: RegionId) {
        startTransition(() => {
            setOptimisticRegion(id);
            document.cookie = `${REGION_COOKIE_NAME}=${id}; path=/; max-age=${REGION_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
            router.refresh();
        });
    }

    return (
        <RegionContext.Provider value={{ region, locale: getRegionOption(region).locale, setRegion }}>
            {children}
        </RegionContext.Provider>
    );
}

export function useRegion() {
    const context = useContext(RegionContext);
    if (!context) {
        throw new Error("useRegion must be used within RegionProvider.");
    }
    return context;
}

export function RegionSetting() {
    const { region, setRegion, locale } = useRegion();
    const selectedOption = getRegionOption(region);

    return (
        <section className="panel max-w-2xl p-5" aria-labelledby="region-title">
            <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 id="region-title" className="text-base font-semibold text-ink">
                            {translate(locale, "settings.region.title")}
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                            {translate(locale, "settings.region.description")}
                        </p>
                    </div>
                    <span className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-lime-200">
                        {translate(locale, selectedOption.descriptionKey)}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={translate(locale, "settings.region.aria.choose")}>
                    {REGION_OPTIONS.map((option, index) => {
                        const selected = option.id === region;
                        return (
                            <button
                                key={option.id}
                                id={`region-${option.id}`}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                tabIndex={selected ? 0 : -1}
                                onClick={() => setRegion(option.id)}
                                onKeyDown={(event) => {
                                    const direction = event.key === "ArrowRight" || event.key === "ArrowDown"
                                        ? 1
                                        : event.key === "ArrowLeft" || event.key === "ArrowUp"
                                            ? -1
                                            : 0;
                                    if (!direction) return;
                                    event.preventDefault();
                                    const next = REGION_OPTIONS[(index + direction + REGION_OPTIONS.length) % REGION_OPTIONS.length];
                                    if (next) {
                                        setRegion(next.id);
                                        document.getElementById(`region-${next.id}`)?.focus();
                                    }
                                }}
                                className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-line bg-canvas px-2 py-2 text-center text-xs text-muted transition-colors hover:border-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-checked:border-accent/60 aria-checked:bg-accent/10 aria-checked:text-lime-500"
                            >
                                <span className="font-bold">{option.label}</span>
                                <span className="text-[10px] text-faint">{translate(locale, option.descriptionKey)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
