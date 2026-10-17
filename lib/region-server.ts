import "server-only";
import { cookies } from "next/headers";
import { getRegionOption, parseRegion, REGION_COOKIE_NAME, type RegionId } from "@/lib/region";

export async function getRegion(): Promise<RegionId> {
    const store = await cookies();
    return parseRegion(store.get(REGION_COOKIE_NAME)?.value ?? null);
}

export async function getRegionLocale(): Promise<string> {
    return getRegionOption(await getRegion()).locale;
}
