export const REGION_COOKIE_NAME = "gigsona-region";

export const REGION_OPTIONS = [
    { id: "geo", label: "GEO", descriptionKey: "settings.region.geo", locale: "ka-GE" },
    { id: "eu", label: "EU", descriptionKey: "settings.region.eu", locale: "en-GB" },
] as const;

export type RegionId = (typeof REGION_OPTIONS)[number]["id"];

export const DEFAULT_REGION: RegionId = "geo";

export function parseRegion(value: string | null): RegionId {
    return REGION_OPTIONS.find((option) => option.id === value)?.id ?? DEFAULT_REGION;
}

export function getRegionOption(id: RegionId) {
    return REGION_OPTIONS.find((option) => option.id === id) ?? REGION_OPTIONS[0];
}
