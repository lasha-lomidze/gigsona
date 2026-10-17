export const DISPLAY_SCALE_STORAGE_KEY = "gigsona:display-scale";

export const DISPLAY_SCALE_OPTIONS = [
    { id: "extra-low", labelKey: "settings.display.scale.extraLow", zoom: "0.67" },
    { id: "very-low", labelKey: "settings.display.scale.veryLow", zoom: "0.8" },
    { id: "low", labelKey: "settings.display.scale.low", zoom: "0.9" },
    { id: "standard", labelKey: "settings.display.scale.standard", zoom: "1" },
    { id: "high", labelKey: "settings.display.scale.high", zoom: "1.1" },
] as const;

export type DisplayScaleId = (typeof DISPLAY_SCALE_OPTIONS)[number]["id"];

export const DEFAULT_DISPLAY_SCALE: DisplayScaleId = "standard";

export function parseDisplayScale(value: string | null): DisplayScaleId {
    return DISPLAY_SCALE_OPTIONS.find((option) => option.id === value)?.id ?? DEFAULT_DISPLAY_SCALE;
}

export function getDisplayScaleOption(id: DisplayScaleId) {
    return DISPLAY_SCALE_OPTIONS.find((option) => option.id === id) ?? DISPLAY_SCALE_OPTIONS[3];
}

export function applyDisplayScale(id: DisplayScaleId) {
    const zoom = getDisplayScaleOption(id).zoom;
    document.documentElement.style.setProperty("--display-scale-factor", zoom);
    document.documentElement.style.zoom = zoom;
}