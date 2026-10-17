"use client";

import type { RefObject } from "react";
import { categoryLabelKey } from "@/lib/aura-stats-shared";
import { useT } from "@/lib/i18n/use-t";
import type { AuraCategory } from "@/types/types";

interface AuraSnapshotTableProps {
    tableRef: RefObject<HTMLDivElement | null>;
    groupName: string;
    formattedLessonDate: string;
    students: { id: number; displayName: string | null }[];
    categories: AuraCategory[];
    auraMap: number[];
}

export function AuraSnapshotTable({
    tableRef,
    groupName,
    formattedLessonDate,
    students,
    categories,
    auraMap,
}: AuraSnapshotTableProps) {
    const t = useT();
    const fallbackStudentName = t("profile.snapshot.unnamedStudent");
    const studentTotals = students.map((_, studentIndex) =>
        categories.reduce((sum, _, categoryIndex) => {
            const flatIndex = studentIndex * categories.length + categoryIndex;
            return sum + (auraMap[flatIndex] ?? 0);
        }, 0),
    );
    const categoryTotals = categories.map((_, categoryIndex) =>
        students.reduce((sum, _, studentIndex) => {
            const flatIndex = studentIndex * categories.length + categoryIndex;
            return sum + (auraMap[flatIndex] ?? 0);
        }, 0),
    );
    const grandTotal = studentTotals.reduce((sum, total) => sum + total, 0);

    return (
        <>
            {/* Offscreen Formatted Printable Table Container */}
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    left: '-99999px',
                    top: 0,
                    pointerEvents: 'none',
                    zIndex: -9999,
                    width: '1140px',
                    overflow: 'hidden',
                }}
            >
                <div
                    ref={tableRef}
                    style={{
                        width: '1140px',
                        backgroundColor: '#0d0d10',
                        color: '#f4f4f5',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        padding: '36px',
                        boxSizing: 'border-box',
                        borderRadius: '24px',
                        border: '2px solid #27272a',
                        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
                    }}
                >
                    {/* Header Banner */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingBottom: '24px',
                            borderBottom: '1px solid #27272a',
                            marginBottom: '24px',
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.16em',
                                    color: '#a3e635',
                                    marginBottom: '6px',
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: '#a3e635',
                                        boxShadow: '0 0 10px rgba(163, 230, 53, 0.6)',
                                    }}
                                />
                                {t('profile.snapshot.brandMatrix')}
                            </div>
                            <h1
                                style={{
                                    fontSize: '28px',
                                    fontWeight: 800,
                                    color: '#ffffff',
                                    letterSpacing: '-0.02em',
                                    margin: 0,
                                }}
                            >
                                {groupName}
                            </h1>
                        </div>

                        {/* Metadata Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    backgroundColor: '#16161a',
                                    border: '1px solid #27272a',
                                    borderRadius: '12px',
                                    padding: '8px 16px',
                                }}
                            >
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#71717a', fontWeight: 600 }}>
                                    {t('profile.snapshot.lessonDay')}
                                </span>
                                {/* Intl output can differ between server and browser ICU data. */}
                                <span suppressHydrationWarning style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'monospace', color: '#f4f4f5', marginTop: '2px' }}>
                                    {formattedLessonDate}
                                </span>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    backgroundColor: '#16161a',
                                    border: '1px solid #27272a',
                                    borderRadius: '12px',
                                    padding: '8px 16px',
                                }}
                            >
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#71717a', fontWeight: 600 }}>
                                    {t('profile.snapshot.students')}
                                </span>
                                <span style={{ fontSize: '15px', fontWeight: 700, color: '#a3e635', marginTop: '2px' }}>
                                    {t('profile.snapshot.totalCount', { count: students.length })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div
                        style={{
                            borderRadius: '16px',
                            border: '1px solid #27272a',
                            backgroundColor: '#111114',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Table Header */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(240px, 2.4fr) repeat(6, minmax(95px, 1fr)) minmax(110px, 1.2fr)',
                                alignItems: 'center',
                                gap: '12px',
                                backgroundColor: '#18181c',
                                borderBottom: '1px solid #27272a',
                                padding: '14px 20px',
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                color: '#a1a1aa',
                            }}
                        >
                            <div>{t('profile.snapshot.student')}</div>
                            {categories.map((cat) => (
                                <div key={cat} style={{ textAlign: 'center' }}>
                                    {t(categoryLabelKey(cat))}
                                </div>
                            ))}
                            <div style={{ textAlign: 'center', color: '#a3e635' }}>{t('profile.snapshot.dayTotal')}</div>
                        </div>

                        {/* Table Rows */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {students.map((student, studentIndex) => {
                                const total = studentTotals[studentIndex];
                                const isEven = studentIndex % 2 === 0;

                                return (
                                    <div
                                        key={student.id}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'minmax(240px, 2.4fr) repeat(6, minmax(95px, 1fr)) minmax(110px, 1.2fr)',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 20px',
                                            backgroundColor: isEven ? '#111114' : '#141418',
                                            borderBottom: studentIndex === students.length - 1 ? 'none' : '1px solid #202024',
                                        }}
                                    >
                                        {/* Student Name */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                            <div
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '8px',
                                                    backgroundColor: '#1c1c22',
                                                    border: '1px solid #27272a',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    color: '#a3e635',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {(student.displayName || fallbackStudentName).trim().charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        fontSize: '14px',
                                                        fontWeight: 600,
                                                        color: '#ffffff',
                                                        lineHeight: '1.3',
                                                        wordBreak: 'break-word',
                                                    }}
                                                >
                                                    {student.displayName || fallbackStudentName}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Category Cells */}
                                        {categories.map((cat, catIndex) => {
                                            const flatIndex = studentIndex * categories.length + catIndex;
                                            const val = auraMap[flatIndex] ?? 0;
                                            const isPositive = val > 0;
                                            const isNegative = val < 0;

                                            return (
                                                <div
                                                    key={cat}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        height: '40px',
                                                        borderRadius: '8px',
                                                        fontFamily: 'monospace',
                                                        fontSize: '14px',
                                                        fontWeight: 700,
                                                        backgroundColor: isPositive
                                                            ? 'rgba(163, 230, 53, 0.12)'
                                                            : isNegative
                                                                ? 'rgba(244, 63, 94, 0.12)'
                                                                : 'rgba(255, 255, 255, 0.03)',
                                                        border: isPositive
                                                            ? '1px solid rgba(163, 230, 53, 0.35)'
                                                            : isNegative
                                                                ? '1px solid rgba(244, 63, 94, 0.35)'
                                                                : '1px solid #27272a',
                                                        color: isPositive ? '#bef264' : isNegative ? '#fda4af' : '#71717a',
                                                    }}
                                                >
                                                    {isPositive ? `+${val}` : val}
                                                </div>
                                            );
                                        })}

                                        {/* Total Cell */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                height: '40px',
                                                borderRadius: '8px',
                                                fontFamily: 'monospace',
                                                fontSize: '15px',
                                                fontWeight: 800,
                                                backgroundColor: total > 0 ? 'rgba(163, 230, 53, 0.22)' : total < 0 ? 'rgba(244, 63, 94, 0.22)' : '#18181c',
                                                border: total > 0 ? '1px solid rgba(163, 230, 53, 0.6)' : total < 0 ? '1px solid rgba(244, 63, 94, 0.6)' : '1px solid #27272a',
                                                color: total > 0 ? '#bef264' : total < 0 ? '#fda4af' : '#a1a1aa',
                                            }}
                                        >
                                            {total > 0 ? `+${total}` : total}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Class Summary Row */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(240px, 2.4fr) repeat(6, minmax(95px, 1fr)) minmax(110px, 1.2fr)',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 20px',
                                backgroundColor: '#18181c',
                                borderTop: '2px solid #27272a',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f4f4f5' }}>
                                    {t('profile.snapshot.groupTotal')}
                                </span>
                            </div>

                            {categories.map((cat, catIndex) => {
                                const total = categoryTotals[catIndex];
                                return (
                                    <div
                                        key={cat}
                                        style={{
                                            textAlign: 'center',
                                            fontFamily: 'monospace',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            color: total > 0 ? '#bef264' : total < 0 ? '#fda4af' : '#71717a',
                                        }}
                                    >
                                        {total > 0 ? `+${total}` : total}
                                    </div>
                                );
                            })}

                            <div
                                style={{
                                    textAlign: 'center',
                                    fontFamily: 'monospace',
                                    fontSize: '16px',
                                    fontWeight: 900,
                                    color: grandTotal > 0 ? '#a3e635' : grandTotal < 0 ? '#fda4af' : '#ffffff',
                                }}
                            >
                                {grandTotal > 0 ? `+${grandTotal}` : grandTotal}
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '20px',
                            paddingTop: '16px',
                            borderTop: '1px solid #202024',
                            fontSize: '11px',
                            color: '#71717a',
                        }}
                    >
                        <span>{t('profile.snapshot.footerOfficial')}</span>
                        <span suppressHydrationWarning>{t('profile.snapshot.footerGeneratedDate', { date: formattedLessonDate })}</span>
                    </div>
                </div>
            </div>
        </>
    );
}
