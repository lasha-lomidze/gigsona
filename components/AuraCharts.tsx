"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { CategoryTotal, TrendPoint } from "@/lib/aura-stats-shared";
import { useT } from "@/lib/i18n/use-t";

// Recharts renders only on the client. Loading it via dynamic import with
// ssr:false keeps its internals (which touch browser/dev APIs) out of SSR.
const CategoryRadarInner = dynamic(
    () => import("./AuraChartsInner").then((m) => m.CategoryRadarInner),
    { ssr: false, loading: () => <ChartSkeleton /> },
) as ComponentType<{ data: CategoryTotal[] }>;

const TrendBarsInner = dynamic(
    () => import("./AuraChartsInner").then((m) => m.TrendBarsInner),
    { ssr: false, loading: () => <ChartSkeleton /> },
) as ComponentType<{ data: TrendPoint[] }>;

function ChartSkeleton() {
    const t = useT();
    return (
        <div className="skeleton grid h-52.5 place-items-center text-xs text-faint">
            {t("overview.chart.loading")}
        </div>
    );
}

export function CategoryRadar({ data }: { data: CategoryTotal[] }) {
    return <CategoryRadarInner data={data} />;
}

export function TrendBars({ data }: { data: TrendPoint[] }) {
    return <TrendBarsInner data={data} />;
}
