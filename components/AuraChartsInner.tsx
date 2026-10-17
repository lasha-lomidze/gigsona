"use client";

import {
    Bar,
    BarChart,
    Cell,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from "recharts";
import { categoryLabelKey, type CategoryTotal, type TrendPoint } from "@/lib/aura-stats-shared";
import { useT } from "@/lib/i18n/use-t";
import { useTheme } from "@/components/ThemeSetting";

export function CategoryRadarInner({ data }: { data: CategoryTotal[] }) {
    const t = useT();
    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme === "light";

    const tooltipStyle = {
        backgroundColor: isLight ? "#ffffff" : "#121214",
        border: `1px solid ${isLight ? "#e2e5eb" : "#27272a"}`,
        borderRadius: "8px",
        fontSize: "12px",
        color: isLight ? "#0f172a" : "#f4f4f5",
        boxShadow: isLight ? "0 4px 12px rgba(0,0,0,0.06)" : "0 8px 24px rgba(0,0,0,0.4)",
    };

    const gridStroke = isLight ? "#e2e5eb" : "#27272a";
    const tickColor = isLight ? "#64748b" : "#a1a1aa";
    const accentStroke = isLight ? "#65a30d" : "#bef264";

    const chartData = data.map((d) => ({ category: t(categoryLabelKey(d.category)), aura: d.total }));
    return (
        <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={chartData} margin={{ top: 12, right: 24, bottom: 12, left: 24 }} outerRadius="62%">
                <PolarGrid stroke={gridStroke} />
                <PolarAngleAxis dataKey="category" tick={{ fill: tickColor, fontSize: 9 }} />
                <PolarRadiusAxis tick={false} axisLine={false} domain={["auto", "auto"]} />
                <Radar dataKey="aura" name={t("overview.chart.aura")} stroke={accentStroke} fill={accentStroke} fillOpacity={isLight ? 0.2 : 0.25} strokeWidth={2} />
                <Tooltip contentStyle={tooltipStyle} cursor={false} />
            </RadarChart>
        </ResponsiveContainer>
    );
}

export function TrendBarsInner({ data }: { data: TrendPoint[] }) {
    const t = useT();
    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme === "light";

    const tooltipStyle = {
        backgroundColor: isLight ? "#ffffff" : "#121214",
        border: `1px solid ${isLight ? "#e2e5eb" : "#27272a"}`,
        borderRadius: "8px",
        fontSize: "12px",
        color: isLight ? "#0f172a" : "#f4f4f5",
        boxShadow: isLight ? "0 4px 12px rgba(0,0,0,0.06)" : "0 8px 24px rgba(0,0,0,0.4)",
    };

    const axisStroke = isLight ? "#e2e5eb" : "#27272a";
    const tickColor = isLight ? "#64748b" : "#71717a";
    const posBarColor = isLight ? "#65a30d" : "#bef264";
    const negBarColor = isLight ? "#e11d48" : "#fda4af";

    return (
        <ResponsiveContainer width="100%" height={210}>
            <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: tickColor, fontSize: 10 }} axisLine={{ stroke: axisStroke }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isLight ? "rgba(101,163,13,0.08)" : "rgba(190,242,100,0.06)" }} />
                <Bar dataKey="delta" name={t("overview.chart.delta")} radius={[3, 3, 0, 0]} maxBarSize={26}>
                    {data.map((entry) => (
                        <Cell key={entry.day} fill={entry.delta >= 0 ? posBarColor : negBarColor} fillOpacity={entry.delta >= 0 ? 0.85 : 0.75} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
