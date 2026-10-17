"use client";

import { useCallback } from "react";
import { useRegion } from "@/components/RegionSetting";
import { translate, type MessageKey, type TranslateValues } from "./index";

export function useT() {
    const { locale } = useRegion();
    return useCallback(
        (key: MessageKey, values?: TranslateValues) => translate(locale, key, values),
        [locale],
    );
}
