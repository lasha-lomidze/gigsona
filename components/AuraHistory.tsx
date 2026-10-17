'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { FiCheck, FiClock, FiEdit2, FiX } from 'react-icons/fi';
import { saveDailyAuraOperations } from '@/actions/manage-aura';
import { useRegion } from '@/components/RegionSetting';
import { motionDuration, motionEase } from '@/components/ui/motion';
import { useT } from '@/lib/i18n/use-t';
import { categoryLabelKey } from '@/lib/aura-stats-shared';
import type { MessageKey } from '@/lib/i18n';
import {
    formatDelta, formatTime, groupOperations, historyCategories,
    type HistoryEntry, type HistoryStudent,
} from '@/lib/aura-history-shared';
import type { AuraCategory, Role } from '@/types/types';

type Props = {
    groupId: number;
    lessonDate: string;
    students: HistoryStudent[];
    entries: HistoryEntry[];
    canEdit: boolean;
};

const valueTone = (value: number) =>
    value > 0 ? 'text-accent' : value < 0 ? 'text-danger' : 'text-faint';

const roleLabelKeys: Record<Role, MessageKey> = {
    anonymous: 'labels.role.anonymous',
    student: 'labels.role.student',
    mentor: 'labels.role.mentor',
    assistant: 'labels.role.assistant',
};

export function AuraHistory({ groupId, lessonDate, students, entries, canEdit }: Props) {
    const router = useRouter();
    const { locale } = useRegion();
    const t = useT();
    const [pending, startTransition] = useTransition();
    const [editing, setEditing] = useState<{ studentId: number; category: AuraCategory } | null>(null);
    const [draft, setDraft] = useState('');
    const [error, setError] = useState('');

    const { rows, values, operations, grandTotal, contributors } = useMemo(() => {
        const latest = new Map<string, number>();
        for (const entry of entries) {
            const key = `${entry.studentId}:${entry.category}`;
            if (!latest.has(key)) latest.set(key, entry.newAura);
        }
        const known = new Map(students.map((student) => [student.id, student]));
        for (const entry of entries) {
            if (!known.has(entry.studentId)) known.set(entry.studentId, { id: entry.studentId, name: entry.studentName });
        }
        const rows = Array.from(known.values()).map((student) => ({
            ...student,
            total: historyCategories.reduce((sum, category) => sum + (latest.get(`${student.id}:${category}`) ?? 0), 0),
        }));
        return {
            rows,
            values: latest,
            operations: groupOperations(entries),
            grandTotal: rows.reduce((sum, row) => sum + row.total, 0),
            contributors: new Set(entries.map((entry) => entry.changedByName)).size,
        };
    }, [entries, students]);

    const top = rows.length ? rows.reduce((best, row) => (row.total > best.total ? row : best)) : null;

    const startEdit = (studentId: number, category: AuraCategory) => {
        if (!canEdit || pending) return;
        setError('');
        setEditing({ studentId, category });
        setDraft(String(values.get(`${studentId}:${category}`) ?? 0));
    };

    const commit = () => {
        if (!editing) return;
        const aura = Number(draft);
        const current = values.get(`${editing.studentId}:${editing.category}`) ?? 0;
        if (!Number.isInteger(aura) || Math.abs(aura) > 10000) {
            setError(t('history.errors.invalidAura'));
            return;
        }
        if (aura === current) {
            setEditing(null);
            return;
        }
        const target = editing;
        startTransition(async () => {
            const result = await saveDailyAuraOperations({
                groupId,
                lessonDate,
                operations: [[{ studentId: target.studentId, category: target.category, aura }]],
            });
            if (!result.ok) {
                setError(result.message);
                return;
            }
            setEditing(null);
            router.refresh();
        });
    };

    const stats = [
        { label: t('history.stats.totalAura'), value: formatDelta(grandTotal), tone: valueTone(grandTotal) },
        { label: t('history.stats.topStudent'), value: top && top.total !== 0 ? top.name : '—', tone: 'text-ink' },
        { label: t('history.stats.studentsScored'), value: String(rows.filter((row) => row.total !== 0).length), tone: 'text-ink' },
        { label: t('history.stats.staffInvolved'), value: String(contributors), tone: 'text-ink' },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: motionDuration.standard, delay: Math.min(idx * 0.02, 0.1), ease: motionEase }}
                        whileHover={{ y: -2, transition: { duration: motionDuration.micro } }}
                        className="panel rounded-xl px-4 py-3 transition-colors hover:border-accent/30"
                    >
                        <div className="text-[11px] uppercase tracking-wider text-faint">{stat.label}</div>
                        <div className={`mt-1 truncate text-xl font-semibold ${stat.tone}`}>{stat.value}</div>
                    </motion.div>
                ))}
            </div>

            {rows.length === 0 ? (
                <div className="empty">
                    {t('history.table.noStudents')}
                </div>
            ) : (
                <div className="panel overflow-hidden rounded-xl">
                    <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-xs text-faint">
                        <span>{entries.length === 0 ? t('history.table.noScores') : t('history.table.finalScore')}</span>
                        {canEdit && <span className="inline-flex items-center gap-1.5 text-accent/80"><FiEdit2 aria-hidden="true" /> {t('history.table.clickToEdit')}</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-180 text-sm">
                            <thead>
                                <tr className="text-left text-[11px] uppercase tracking-wider text-faint">
                                    <th className="sticky left-0 bg-canvas px-4 py-2.5 font-medium">{t('history.table.student')}</th>
                                    {historyCategories.map((category) => (
                                        <th key={category} className="px-3 py-2.5 text-center font-medium">{t(categoryLabelKey(category))}</th>
                                    ))}
                                    <th className="px-4 py-2.5 text-right font-medium">{t('history.table.total')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id} className="border-t border-line/70 hover:bg-line/20">
                                        <td className="sticky left-0 bg-canvas px-4 py-2 font-medium text-ink">{row.name}</td>
                                        {historyCategories.map((category) => {
                                            const value = values.get(`${row.id}:${category}`) ?? 0;
                                            const isEditing = editing?.studentId === row.id && editing.category === category;
                                            return (
                                                <td key={category} className="px-2 py-1 text-center">
                                                    {isEditing ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <input
                                                                autoFocus
                                                                type="number"
                                                                inputMode="numeric"
                                                                value={draft}
                                                                disabled={pending}
                                                                aria-label={t('history.table.inputLabel', { category: t(categoryLabelKey(category)), name: row.name })}
                                                                onChange={(event) => setDraft(event.target.value)}
                                                                onKeyDown={(event) => {
                                                                    if (event.key === 'Enter') commit();
                                                                    if (event.key === 'Escape') setEditing(null);
                                                                }}
                                                                className="h-8 w-20 rounded border border-accent/60 bg-canvas px-2 text-center text-ink outline-none"
                                                            />
                                                            <button type="button" onClick={commit} disabled={pending} aria-label={t('history.actions.save')} className="grid size-7 place-items-center rounded bg-accent text-accent-ink"><FiCheck /></button>
                                                            <button type="button" onClick={() => setEditing(null)} aria-label={t('history.actions.cancel')} className="grid size-7 place-items-center rounded border border-line text-muted"><FiX /></button>
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled={!canEdit}
                                                            onClick={() => startEdit(row.id, category)}
                                                            className={`min-w-12 rounded-md px-2 py-1 font-medium tabular-nums transition ${valueTone(value)} ${canEdit ? 'hover:bg-accent/10 hover:ring-1 hover:ring-accent/40' : 'cursor-default'}`}
                                                        >
                                                            {value === 0 ? '·' : formatDelta(value)}
                                                        </button>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className={`px-4 py-2 text-right font-semibold tabular-nums ${valueTone(row.total)}`}>{formatDelta(row.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {error && <div role="alert" className="border-t border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{error}</div>}
                </div>
            )}

            <section aria-labelledby="ledger-title">
                <h2 id="ledger-title" className="mb-3 text-lg font-semibold text-ink">{t('history.ledger.title')}</h2>
                {operations.length === 0 ? (
                    <p className="text-sm text-faint">{t('history.ledger.empty')}</p>
                ) : (
                    <ol className="flex flex-col gap-3">
                        {operations.map((operation, opIdx) => (
                            <motion.li
                                key={operation.key}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: motionDuration.standard, delay: Math.min(opIdx * 0.02, 0.2), ease: motionEase }}
                                className="panel p-4 transition-colors hover:border-accent/25"
                            >
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="font-semibold text-ink">{operation.changedByName}</span>
                                    {operation.changedByRole && (
                                        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">{t(roleLabelKeys[operation.changedByRole])}</span>
                                    )}
                                    <span className="inline-flex items-center gap-1 text-xs text-faint"><FiClock aria-hidden="true" />{formatTime(operation.createdAt, locale)}</span>
                                    <span className={`ml-auto text-sm font-semibold tabular-nums ${valueTone(operation.delta)}`}>{formatDelta(operation.delta)}</span>
                                </div>
                                <ul className="mt-3 flex flex-wrap gap-2">
                                    {operation.entries.map((entry) => {
                                        const delta = entry.newAura - entry.previousAura;
                                        return (
                                            <li key={entry.id} className="rounded-lg border border-line bg-canvas/60 px-2.5 py-1 text-xs text-muted">
                                                <span className="text-ink">{entry.studentName}</span>
                                                <span className="text-faint"> · {t(categoryLabelKey(entry.category))} · {entry.previousAura} → {entry.newAura} </span>
                                                <span className={`font-semibold ${valueTone(delta)}`}>({formatDelta(delta)})</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </motion.li>
                        ))}
                    </ol>
                )}
            </section>
        </div>
    );
}
