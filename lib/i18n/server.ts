import { getRegionLocale } from "@/lib/region-server";
import { translate, type MessageKey, type TranslateValues } from "./index";

export async function getT() {
    const locale = await getRegionLocale();
    return (key: MessageKey, values?: TranslateValues) => translate(locale, key, values);
}
