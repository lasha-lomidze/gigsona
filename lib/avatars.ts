// Curated preset avatar catalog.
// Files live in public/avatars/. id = filename without extension.

export interface PresetAvatar {
    id: string;
    src: string;
    label: string;
    group: string;
}

const GROUP_LABELS: Record<string, string> = {
    lorelei: "People",
    bottts: "Bots",
    pixelbot: "Pixel Bots",
    shapes: "Shapes",
    blobs: "Blobs",
    planets: "Planets",
    constellation: "Constellations",
};

// Faces first (lorelei, bottts, pixelbot), then non-faces.
const AVATAR_IDS = [
    "lorelei1", "lorelei2", "lorelei3", "lorelei4", "lorelei5",
    "bottts1", "bottts2", "bottts3", "bottts4", "bottts5",
    "pixelbot1", "pixelbot2", "pixelbot3", "pixelbot4", "pixelbot5",
    "shapes1", "shapes2", "shapes3", "shapes4", "shapes5",
    "blobs1", "blobs2", "blobs3", "blobs4", "blobs5",
    "planets1", "planets2", "planets3", "planets4", "planets5",
    "constellation1", "constellation2", "constellation3", "constellation4", "constellation5",
] as const;

export const PRESET_AVATARS: PresetAvatar[] = AVATAR_IDS.map((id) => {
    const group = id.replace(/[0-9]+$/, "");
    const num = id.replace(/^[a-z]+/, "");
    return {
        id,
        src: `/avatars/${id}.svg`,
        label: `${GROUP_LABELS[group] ?? group} ${num}`,
        group,
    };
});

const VALID_IDS = new Set<string>(PRESET_AVATARS.map((a) => a.id));

export function isValidAvatarId(id: string | null | undefined): id is string {
    return !!id && VALID_IDS.has(id);
}

export function getAvatarById(id: string | null | undefined): PresetAvatar | null {
    if (!id) return null;
    return PRESET_AVATARS.find((a) => a.id === id) ?? null;
}

export function getAvatarSrc(id: string | null | undefined): string | null {
    return getAvatarById(id)?.src ?? null;
}
