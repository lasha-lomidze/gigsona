import { Fragment, useMemo } from 'react';
import { FiArrowRight, FiCheck, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { categoryLabelKey } from '@/lib/aura-stats-shared';
import { useT } from '@/lib/i18n/use-t';

export const rulebookPages = [
    { id: 'sheet', labelKey: 'manage.rulebook.sheet.label', titleKey: 'manage.rulebook.sheet.title', summaryKey: 'manage.rulebook.sheet.summary' },
    { id: 'select', labelKey: 'manage.rulebook.select.label', titleKey: 'manage.rulebook.select.title', summaryKey: 'manage.rulebook.select.summary' },
    { id: 'columns', labelKey: 'manage.rulebook.columns.label', titleKey: 'manage.rulebook.columns.title', summaryKey: 'manage.rulebook.columns.summary' },
    { id: 'find', labelKey: 'manage.rulebook.find.label', titleKey: 'manage.rulebook.find.title', summaryKey: 'manage.rulebook.find.summary' },
    { id: 'visibility', labelKey: 'manage.rulebook.visibility.label', titleKey: 'manage.rulebook.visibility.title', summaryKey: 'manage.rulebook.visibility.summary' },
    { id: 'award', labelKey: 'manage.rulebook.award.label', titleKey: 'manage.rulebook.award.title', summaryKey: 'manage.rulebook.award.summary' },
    { id: 'undo', labelKey: 'manage.rulebook.undo.label', titleKey: 'manage.rulebook.undo.title', summaryKey: 'manage.rulebook.undo.summary' },
    { id: 'correct', labelKey: 'manage.rulebook.correct.label', titleKey: 'manage.rulebook.correct.title', summaryKey: 'manage.rulebook.correct.summary' },
    { id: 'past', labelKey: 'manage.rulebook.past.label', titleKey: 'manage.rulebook.past.title', summaryKey: 'manage.rulebook.past.summary' },
    { id: 'navigate', labelKey: 'manage.rulebook.navigate.label', titleKey: 'manage.rulebook.navigate.title', summaryKey: 'manage.rulebook.navigate.summary' },
] as const;
export type RulebookPage = (typeof rulebookPages)[number]['id'];
export function RulebookIllustration({ page }: { page: RulebookPage }) {
    const t = useT();
    const categoryLabels = useMemo(() => ({
        attendance: t(categoryLabelKey('attendance')),
        camera: t(categoryLabelKey('camera')),
        activity: t(categoryLabelKey('activity')),
        qa: t(categoryLabelKey('qa')),
        classwork: t(categoryLabelKey('classwork')),
        workout: t(categoryLabelKey('workout')),
    }), [t]);

    if (page === 'sheet') {
        return (
            <div className="relative overflow-hidden border border-line bg-[radial-gradient(ellipse_at_top_left,rgba(163,230,53,0.08),transparent_55%)] p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
                    <div><p className="text-[10px] uppercase tracking-[0.16em] text-accent">{t('manage.rulebook.sheet.illustration.activeGroup')}</p><p className="mt-1 text-sm font-semibold text-ink">{t('manage.rulebook.sheet.illustration.group115')}</p></div>
                    <div><p className="text-[10px] uppercase tracking-[0.16em] text-faint">{t('manage.rulebook.sheet.illustration.lessonDay')}</p><p className="mt-1 font-mono text-sm text-ink">2026-10-05</p></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-md border border-accent/50 bg-accent/10 px-3 py-2 text-xs font-medium text-lime-200">{t('manage.rulebook.sheet.illustration.group115')} <span className="ml-1 text-accent">{t('labels.status.active')}</span></span>
                    <span className="rounded-md border border-line bg-canvas px-3 py-2 text-xs text-faint">{t('manage.rulebook.sheet.illustration.group116')}</span>
                </div>
                <p className="mt-4 text-xs text-faint">{t('manage.rulebook.sheet.illustration.description')}</p>
            </div>
        );
    }
    if (page === 'select') {
        return (
            <div className="relative overflow-hidden border border-violet-300/20 bg-[radial-gradient(ellipse_at_top_right,rgba(167,139,250,0.14),transparent_48%),linear-gradient(145deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200">{t('manage.rulebook.select.illustration.pickScores')}</p>
                        <p className="mt-1 text-xs text-faint">{t('manage.rulebook.select.illustration.selectionSpans')}</p>
                    </div>
                    <span className="rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1.5 font-mono text-[10px] text-violet-100">{t('manage.rulebook.select.illustration.twoSelected')}</span>
                </div>
                <div className="overflow-hidden rounded-xl border border-white/8 bg-black/20 p-3">
                    <div className="grid grid-cols-[minmax(72px,1fr)_repeat(3,minmax(44px,0.8fr))] items-center gap-2 pb-2 text-[9px] font-semibold uppercase tracking-wider text-faint">
                        <span>{t('manage.table.student')}</span><span className="text-center">{t('manage.common.attend')}</span><span className="text-center">{categoryLabels.activity}</span><span className="text-center">{categoryLabels.classwork}</span>
                    </div>
                    {[
                        { name: 'Nino', initials: 'N', values: ['+10', '+20', '+0'], selected: [1] },
                        { name: 'Giorgi', initials: 'G', values: ['+0', '+10', '+15'], selected: [2] },
                        { name: 'Anna', initials: 'A', values: ['+20', '+0', '+5'], selected: [] },
                    ].map((row) => (
                        <div key={row.name} className="grid grid-cols-[minmax(72px,1fr)_repeat(3,minmax(44px,0.8fr))] items-center gap-2 border-t border-white/6 py-2">
                            <span className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-muted"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/6 text-[9px] text-faint">{row.initials}</span>{row.name}</span>
                            {row.values.map((value, columnIndex) => {
                                const active = row.selected.includes(columnIndex);
                                return <span key={columnIndex} className={`relative rounded-md border px-1.5 py-2 text-center font-mono text-[11px] ${active ? 'border-violet-300/50 bg-violet-300/15 text-violet-100 shadow-[0_0_18px_rgba(167,139,250,0.1)]' : 'border-white/6 bg-white/2.5 text-faint'}`}>{value}{active && <FiCheck aria-hidden="true" className="absolute -right-1 -top-1 size-3 rounded-full bg-violet-300 p-0.5 text-black" />}</span>;
                            })}
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-faint"><span>{t('manage.rulebook.select.illustration.clickInstruction')}</span><kbd className="rounded border border-violet-300/25 bg-violet-300/8 px-2 py-1 font-mono text-violet-100">{t('manage.rulebook.select.illustration.optionClickSolo')}</kbd></div>
            </div>
        );
    }

    if (page === 'columns') {
        return (
            <div className="relative overflow-hidden border border-sky-300/20 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.12),transparent_50%),linear-gradient(145deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200">{t('manage.rulebook.columns.illustration.workByCategory')}</p><p className="mt-1 text-xs text-faint">{t('manage.rulebook.columns.illustration.chooseColumn')}</p></div>
                    <span className="rounded-md border border-sky-300/25 bg-sky-300/8 px-2.5 py-1.5 font-mono text-[10px] text-sky-100">1–6</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                        { number: '1', label: categoryLabels.attendance, color: 'text-emerald-200', dot: 'bg-emerald-300' },
                        { number: '2', label: categoryLabels.camera, color: 'text-cyan-200', dot: 'bg-cyan-300' },
                        { number: '3', label: categoryLabels.activity, color: 'text-sky-100', dot: 'bg-sky-300', active: true },
                        { number: '4', label: categoryLabels.qa, color: 'text-amber-200', dot: 'bg-amber-300' },
                        { number: '5', label: categoryLabels.classwork, color: 'text-fuchsia-200', dot: 'bg-fuchsia-300' },
                        { number: '6', label: categoryLabels.workout, color: 'text-rose-200', dot: 'bg-rose-300' },
                    ].map((category) => (
                        <div key={category.label} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 ${category.active ? 'border-sky-300/45 bg-sky-300/10 shadow-[0_0_22px_rgba(56,189,248,0.1)]' : 'border-white/7 bg-white/2.5'}`}>
                            <span className={`size-2 rounded-full ${category.dot}`} />
                            <span className={`min-w-0 flex-1 truncate text-[11px] font-medium ${category.active ? 'text-sky-100' : category.color}`}>{category.label}</span>
                            <kbd className="font-mono text-[9px] text-faint">{category.number}</kbd>
                            {category.active && <FiLock aria-label={t('manage.rulebook.columns.illustration.lockedCategory')} className="size-3 text-sky-200" />}
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-faint">
                    <span className="rounded border border-sky-300/20 bg-sky-300/5 px-2 py-1 text-sky-100">{t('manage.rulebook.columns.illustration.optionHeaderLock')}</span>
                    <span>{t('manage.rulebook.columns.illustration.consecutiveNumbers')}</span>
                </div>
            </div>
        );
    }

    if (page === 'find') {
        return (
            <div className="relative overflow-hidden border border-line bg-[radial-gradient(ellipse_at_top_left,rgba(163,230,53,0.1),transparent_50%)] p-4 sm:p-6">
                <div className="mx-auto max-w-xl">
                    <div className="flex items-center gap-3 rounded-xl border border-accent/35 bg-surface px-4 py-3 shadow-[0_0_30px_rgba(163,230,53,0.08)]">
                        <span className="text-lg text-accent">⌕</span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">{t('manage.rulebook.find.illustration.quickFind')}</p>
                            <p className="mt-0.5 font-mono text-sm text-ink">gio<span className="animate-pulse text-accent">|</span></p>
                        </div>
                        <kbd className="rounded border border-line bg-canvas px-2 py-1 font-mono text-[9px] text-faint">{t('manage.rulebook.find.illustration.prefix')}</kbd>
                    </div>
                    <div className="ml-6 border-l border-accent/20 pl-4 pt-2">
                        <p className="mb-2 text-[9px] uppercase tracking-wider text-faint">{t('manage.rulebook.find.illustration.matchingStudents')}</p>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/8 px-3 py-2.5 shadow-[0_0_22px_rgba(163,230,53,0.08)]">
                                <span className="grid size-7 place-items-center rounded-full bg-accent/15 text-[10px] font-semibold text-lime-100">G</span>
                                <span className="flex-1 text-xs font-medium text-lime-100">Giorgi Beridze</span>
                                <span className="rounded-full bg-accent/10 px-2 py-1 text-[9px] text-accent">{t('manage.rulebook.find.illustration.rowFocused')}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 opacity-45">
                                <span className="grid size-7 place-items-center rounded-full bg-white/5 text-[10px] text-faint">G</span>
                                <span className="text-[11px] text-muted">Gvantsa Maisuradze</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-faint"><FiArrowRight aria-hidden="true" className="text-accent" /> {t('manage.rulebook.find.illustration.jumpInstruction')}</div>
                </div>
            </div>
        );
    }

    if (page === 'visibility') {
        return (
            <div className="grid gap-3 border border-line bg-[radial-gradient(ellipse_at_top_left,rgba(251,191,36,0.08),transparent_45%)] p-4 sm:grid-cols-2 sm:p-6">
                <div className="relative overflow-hidden rounded-xl border border-amber-300/20 bg-amber-300/[0.035] p-4">
                    <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200">{t('manage.rulebook.visibility.illustration.absentStudents')}</p><span className="grid size-8 place-items-center rounded-full bg-amber-300/10 text-amber-200"><FiEyeOff aria-hidden="true" /></span></div>
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 rounded-md border border-dashed border-amber-300/20 bg-black/20 px-2.5 py-2 opacity-45"><span className="size-5 rounded-full bg-amber-200/15" /><span className="flex-1 text-[11px] text-muted">Nino</span><span className="rounded-full bg-amber-300/10 px-2 py-0.5 text-[9px] text-amber-100">{t('manage.rulebook.visibility.illustration.absent')}</span><FiEyeOff aria-hidden="true" className="size-3 text-amber-100" /></div>
                        <div className="flex items-center gap-2 rounded-md border border-white/6 bg-black/20 px-2.5 py-2"><span className="size-5 rounded-full bg-white/10" /><span className="flex-1 text-[11px] text-muted">Giorgi</span><FiEye aria-hidden="true" className="size-3 text-amber-100/70" /></div>
                    </div>
                    <p className="mt-3 text-[10px] leading-4 text-faint">{t('manage.rulebook.visibility.illustration.hiddenRows')}</p>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-lime-300/20 bg-lime-300/[0.035] p-4">
                    <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-wider text-lime-200">{t('manage.rulebook.visibility.illustration.zeroScores')}</p><span className="grid size-8 place-items-center rounded-full bg-lime-300/10 font-mono text-xs text-lime-100">+0</span></div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <span className="rounded-md border border-white/8 bg-black/20 py-3 text-center font-mono text-xs text-faint">+10</span>
                        <span className="rounded-md border border-dashed border-lime-300/35 bg-lime-300/8 py-3 text-center font-mono text-xs text-lime-100">+0</span>
                        <span className="rounded-md border border-white/8 bg-black/20 py-3 text-center font-mono text-xs text-faint">+5</span>
                    </div>
                    <p className="mt-3 text-[10px] leading-4 text-faint">{t('manage.rulebook.visibility.illustration.toggleUntouched')}</p>
                </div>
            </div>
        );
    }

    if (page === 'award') {
        return (
            <div className="relative overflow-hidden border border-lime-300/20 bg-[radial-gradient(ellipse_at_center,rgba(163,230,53,0.13),transparent_62%),linear-gradient(145deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-4 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_170px] sm:items-center">
                    <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                        <div className="mb-2 flex items-center justify-between text-[9px] font-semibold uppercase tracking-wider text-faint"><span>{t('manage.rulebook.award.illustration.selectionActivity', { category: categoryLabels.activity })}</span><span>{t('manage.rulebook.award.illustration.threeCells')}</span></div>
                        <div className="grid grid-cols-[1fr_repeat(3,54px)] items-center gap-1.5 text-center">
                            <span className="text-left text-[9px] text-faint">{t('manage.table.student')}</span><span className="text-[8px] text-faint">{t('manage.common.attend')}</span><span className="text-[8px] text-lime-100">{categoryLabels.activity}</span><span className="text-[8px] text-faint">{categoryLabels.classwork}</span>
                            {[
                                { name: 'Nino', selected: true },
                                { name: 'Giorgi', selected: true },
                                { name: 'Anna', selected: false },
                            ].map((row) => (
                                <Fragment key={row.name}>
                                    <span className="truncate text-left text-[10px] text-muted">{row.name}</span>
                                    <span className="rounded border border-white/6 bg-white/2.5 py-2 font-mono text-[9px] text-faint">+0</span>
                                    <span className={`rounded border py-2 font-mono text-[9px] ${row.selected ? 'border-lime-300/55 bg-lime-300/15 text-lime-100 shadow-[0_0_16px_rgba(163,230,53,0.16)]' : 'border-white/6 bg-white/2.5 text-faint'}`}>{row.selected ? '+20' : '+0'}</span>
                                    <span className="rounded border border-white/6 bg-white/2.5 py-2 font-mono text-[9px] text-faint">+0</span>
                                </Fragment>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col">
                        <div className="relative grid size-20 shrink-0 place-items-center rounded-full border border-accent/35 bg-accent/8 shadow-[0_0_38px_rgba(163,230,53,0.14)]">
                            <span className="absolute inset-2 rounded-full border border-dashed border-accent/25" />
                            <span className="text-xl font-bold text-lime-100">+20</span>
                            <span className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full border border-accent/35 bg-surface text-accent"><FiCheck aria-hidden="true" /></span>
                        </div>
                        <div className="min-w-0">
                            <kbd className="rounded-md border border-accent/35 bg-accent/10 px-3 py-1.5 font-mono text-xs text-lime-100">SPACE</kbd>
                            <p className="mt-2 text-[10px] leading-4 text-faint">{t('manage.rulebook.award.illustration.defaultAdded')}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/6 pt-3 text-[10px]"><span className="text-faint">{t('manage.rulebook.award.illustration.selectedScores', { category: categoryLabels.activity })}</span><span className="font-mono text-lime-100">{t('manage.rulebook.award.illustration.threeByTwentyAura')}</span></div>
                <p className="mt-2 text-[10px] leading-4 text-faint">{t('manage.rulebook.award.illustration.description')}</p>
            </div>
        );
    }

    if (page === 'correct') {
        return (
            <div className="relative overflow-hidden border border-cyan-300/20 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.12),transparent_48%),linear-gradient(145deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-4 sm:p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">{t('manage.rulebook.correct.illustration.inlineEditor')}</p><p className="mt-1 text-[10px] text-faint">{t('manage.rulebook.correct.illustration.ninoAttendance', { category: categoryLabels.attendance })}</p></div>
                    <kbd className="rounded border border-cyan-200/20 bg-cyan-200/5 px-2 py-1 font-mono text-[10px] text-cyan-100">F2</kbd>
                </div>
                <div className="overflow-hidden rounded-xl border border-white/8 bg-black/20">
                    <div className="grid grid-cols-[minmax(84px,1.2fr)_repeat(3,minmax(48px,1fr))] items-center gap-2 border-b border-white/6 px-3 py-2 text-[8px] font-semibold uppercase tracking-wider text-faint"><span>{t('manage.table.student')}</span><span className="text-center text-cyan-100">{categoryLabels.attendance}</span><span className="text-center">{categoryLabels.activity}</span><span className="text-center">{categoryLabels.classwork}</span></div>
                    <div className="grid grid-cols-[minmax(84px,1.2fr)_repeat(3,minmax(48px,1fr))] items-center gap-2 px-3 py-3">
                        <span className="truncate text-[10px] text-muted">Nino Tskhadadze</span>
                        <span className="flex items-center justify-center gap-1 rounded-md border border-cyan-200/45 bg-cyan-200/10 px-1 py-2 font-mono text-[10px] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.1)]">+5<span className="h-3 w-px animate-pulse bg-cyan-100" /></span>
                        <span className="rounded-md border border-white/6 bg-white/2.5 py-2 text-center font-mono text-[9px] text-faint">+20</span>
                        <span className="rounded-md border border-white/6 bg-white/2.5 py-2 text-center font-mono text-[9px] text-faint">+0</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-white/6 bg-white/2 px-3 py-2">
                        <span className="text-[9px] text-faint">{t('manage.rulebook.correct.illustration.enterEsc')}</span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-cyan-200/25 bg-cyan-200/8 px-2 py-1 text-[9px] text-cyan-100"><FiCheck aria-hidden="true" /> {t('manage.status.saved')}</span>
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-faint"><span className="h-px flex-1 bg-cyan-200/15" /><span>{t('manage.rulebook.correct.illustration.historyKeepsTotal')}</span><span className="h-px flex-1 bg-cyan-200/15" /></div>
                <p className="mt-2 text-[10px] leading-4 text-faint">{t('manage.rulebook.correct.illustration.description')}</p>
            </div>
        );
    }

    if (page === 'undo') {
        return (
            <div className="relative overflow-hidden border border-rose-300/20 bg-[radial-gradient(ellipse_at_top_right,rgba(244,114,182,0.12),transparent_50%),linear-gradient(145deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-200">{t('manage.rulebook.undo.illustration.actionHistory')}</p><p className="mt-1 text-xs text-faint">{t('manage.rulebook.undo.illustration.savedChanges')}</p></div>
                    <div className="flex gap-1.5"><kbd className="rounded border border-white/10 bg-white/5 px-2 py-1.5 font-mono text-[10px] text-muted">⌘ Z</kbd><kbd className="rounded border border-white/10 bg-white/5 px-2 py-1.5 font-mono text-[10px] text-muted">⇧ Z</kbd></div>
                </div>
                <div className="relative ml-2 space-y-3 border-l border-rose-200/20 pl-5">
                    <div className="relative rounded-lg border border-white/8 bg-white/2.5 p-3">
                        <span className="absolute left-[-1.68rem] top-4 size-2.5 rounded-full border-2 border-surface bg-faint" />
                        <div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-muted">{t('manage.rulebook.undo.illustration.attendanceNino', { category: categoryLabels.attendance })}</span><span className="font-mono text-[11px] text-faint">+10</span></div>
                        <p className="mt-1 text-[10px] text-faint">{t('manage.rulebook.undo.illustration.earlierScore')}</p>
                    </div>
                    <div className="relative rounded-lg border border-rose-300/30 bg-rose-300/6 p-3">
                        <span className="absolute left-[-1.68rem] top-4 size-2.5 rounded-full border-2 border-surface bg-rose-300 shadow-[0_0_12px_rgba(244,114,182,0.45)]" />
                        <div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-rose-100">{t('manage.rulebook.undo.illustration.activityAward', { category: categoryLabels.activity })}</span><span className="font-mono text-[11px] text-rose-100">+20</span></div>
                        <p className="mt-1 text-[10px] text-rose-100/60">{t('manage.rulebook.undo.illustration.justSaved')}</p>
                    </div>
                    <div className="relative flex items-center gap-2 rounded-lg border border-dashed border-rose-200/20 px-3 py-2.5 text-[10px] text-faint">
                        <span className="absolute left-[-1.68rem] size-2.5 rounded-full border-2 border-surface bg-line" />
                        <FiArrowRight aria-hidden="true" className="rotate-180 text-rose-200" /> {t('manage.rulebook.undo.illustration.undoRestores')}
                    </div>
                </div>
                <p className="mt-3 text-[10px] leading-4 text-faint">{t('manage.rulebook.undo.illustration.description')}</p>
            </div>
        );
    }

    if (page === 'past') {
        return (
            <div className="relative overflow-hidden border border-cyan-300/20 bg-[radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.12),transparent_48%),linear-gradient(145deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">{t('manage.rulebook.past.illustration.historyOctober')}</p><p className="mt-1 text-xs text-faint">{t('manage.rulebook.past.illustration.pastDaysEditable')}</p></div>
                    <span className="rounded-md border border-cyan-200/20 bg-cyan-200/8 px-2.5 py-1.5 font-mono text-[10px] text-cyan-100">{t('manage.rulebook.past.illustration.mentorAccess')}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
                    <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                        <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-wider text-faint"><span>{t('manage.rulebook.past.illustration.lessonDays')}</span><span>{t('manage.rulebook.past.illustration.oct')}</span></div>
                        <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
                            {['05', '08', '12', '16'].map((day, index) => <span key={day} className={`rounded-md py-2 ${index === 0 ? 'border border-cyan-200/35 bg-cyan-200/10 text-cyan-100' : 'border border-white/5 text-faint'}`}>{day}</span>)}
                        </div>
                        <p className="mt-3 text-[10px] text-cyan-100/75">{t('manage.rulebook.past.illustration.selectedDay')}</p>
                    </div>
                    <div className="rounded-xl border border-cyan-200/20 bg-cyan-200/4.5 p-3">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-cyan-200">{t('manage.rulebook.past.illustration.correctionAudit')}</p>
                        <div className="mt-3 flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-cyan-200/25 bg-cyan-200/10 text-xs font-semibold text-cyan-100">MK</span>
                            <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-ink">Mariam K.</p><p className="mt-0.5 text-[10px] text-faint">{t('manage.rulebook.past.illustration.auditEntry', { category: categoryLabels.attendance })}</p></div>
                            <span className="text-[9px] text-cyan-100/70">{t('manage.rulebook.past.illustration.logged')}</span>
                        </div>
                    </div>
                </div>
                <p className="mt-3 text-[10px] leading-4 text-faint">{t('manage.rulebook.past.illustration.description')}</p>
            </div>
        );
    }

    if (page === 'navigate') {
        return (
            <div className="relative overflow-hidden border border-line bg-[radial-gradient(ellipse_at_center,rgba(163,230,53,0.09),transparent_62%)] p-4 sm:p-6">
                <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="overflow-hidden rounded-xl border border-white/8 bg-black/20 p-3">
                        <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-wider text-faint"><span>{t('manage.rulebook.navigate.illustration.scoreGrid')}</span><span className="font-mono">{t('manage.rulebook.navigate.illustration.rowCol')}</span></div>
                        <div className="grid grid-cols-5 gap-1.5">
                            {Array.from({ length: 15 }, (_, index) => <span key={index} className={`grid aspect-[1.7] place-items-center rounded-md border font-mono text-[9px] ${index === 8 ? 'border-lime-300/50 bg-lime-300/15 text-lime-100 shadow-[0_0_18px_rgba(163,230,53,0.12)]' : 'border-white/6 bg-white/2.5 text-faint'}`}>{index === 8 ? '+20' : index % 3 === 0 ? '+10' : '+0'}</span>)}
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-4 sm:flex-col sm:gap-3">
                        <div className="grid grid-cols-3 gap-1 text-center font-mono text-xs text-muted">
                            <span />
                            <kbd className="rounded-md border border-white/10 bg-white/5 px-3 py-2">↑</kbd>
                            <span />
                            <kbd className="rounded-md border border-white/10 bg-white/5 px-3 py-2">←</kbd>
                            <kbd className="rounded-md border border-lime-300/40 bg-lime-300/10 px-3 py-2 text-lime-100">↓</kbd>
                            <kbd className="rounded-md border border-white/10 bg-white/5 px-3 py-2">→</kbd>
                        </div>
                        <div className="text-center sm:max-w-32"><p className="text-[10px] font-semibold uppercase tracking-wider text-lime-200">{t('manage.rulebook.navigate.illustration.moveCellToCell')}</p><p className="mt-1 text-[10px] leading-4 text-faint">{t('manage.rulebook.navigate.illustration.arrowsWrap')}</p></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-3 border border-line bg-canvas p-4 sm:grid-cols-2 sm:p-6">
            <div className="border border-line bg-surface/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-faint">{t('manage.rulebook.shortcuts.selectAllOrInvert')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {[t('manage.rulebook.shortcuts.optionA'), t('manage.rulebook.shortcuts.optionB'), t('manage.rulebook.shortcuts.escape')].map((item) => <kbd key={item} className="rounded border border-line bg-canvas px-2 py-1.5 text-[10px] text-muted">{item}</kbd>)}
                </div>
            </div>
            <div className="border border-line bg-surface/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-faint">{t('manage.rulebook.shortcuts.undoRedoReset')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {[t('manage.rulebook.shortcuts.undoAura'), t('manage.rulebook.shortcuts.redoAura'), t('manage.rulebook.shortcuts.defaultZero')].map((item) => <kbd key={item} className="rounded border border-line bg-canvas px-2 py-1.5 text-[10px] text-muted">{item}</kbd>)}
                </div>
            </div>
        </div>
    );
}
