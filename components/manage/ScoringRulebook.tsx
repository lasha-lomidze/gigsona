import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { FiArrowRight, FiBookOpen, FiX } from 'react-icons/fi';
import { useT } from '@/lib/i18n/use-t';
import { RulebookIllustration, rulebookPages } from './RulebookIllustrations';

const rulebookPreferenceListeners = new Map<string, Set<() => void>>();
const rulebookPreferenceValues = new Map<string, boolean>();

function subscribeToRulebookPreference(storageKey: string | undefined, onChange: () => void) {
    if (!storageKey || typeof window === 'undefined') return () => { };

    let listeners = rulebookPreferenceListeners.get(storageKey);
    if (!listeners) {
        listeners = new Set();
        rulebookPreferenceListeners.set(storageKey, listeners);
    }
    listeners.add(onChange);

    const preferenceKey = `${storageKey}:rulebookSeen`;
    const handleStorage = (event: StorageEvent) => {
        if (event.key !== preferenceKey && event.key !== null) return;
        rulebookPreferenceValues.delete(storageKey);
        onChange();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener('storage', handleStorage);
        listeners?.delete(onChange);
        if (listeners?.size === 0) rulebookPreferenceListeners.delete(storageKey);
    };
}

function getRulebookPreferenceSnapshot(storageKey: string | undefined) {
    if (!storageKey) return false;
    if (rulebookPreferenceValues.has(storageKey)) return rulebookPreferenceValues.get(storageKey) ?? false;
    try {
        const hasSeenRulebook = localStorage.getItem(`${storageKey}:rulebookSeen`) === 'true';
        rulebookPreferenceValues.set(storageKey, hasSeenRulebook);
        return hasSeenRulebook;
    } catch (error) {
        console.error('Could not load the Manage rulebook preference.', error);
        rulebookPreferenceValues.set(storageKey, false);
        return false;
    }
}

function saveRulebookPreference(storageKey: string | undefined) {
    if (!storageKey) return;
    rulebookPreferenceValues.set(storageKey, true);
    try {
        localStorage.setItem(`${storageKey}:rulebookSeen`, 'true');
    } catch (error) {
        console.error('Could not save the Manage rulebook preference.', error);
    }
    rulebookPreferenceListeners.get(storageKey)?.forEach((onChange) => onChange());
}

export function ScoringRulebook({ preferenceKey }: { preferenceKey?: string }) {
    const t = useT();
    const [open, setOpen] = useState(false);
    const [activePageIndex, setActivePageIndex] = useState(0);
    const subscribeToRulebook = useCallback(
        (onChange: () => void) => subscribeToRulebookPreference(preferenceKey, onChange),
        [preferenceKey],
    );
    const readRulebookPreference = useCallback(
        () => getRulebookPreferenceSnapshot(preferenceKey),
        [preferenceKey],
    );
    const hasSeenRulebook = useSyncExternalStore(subscribeToRulebook, readRulebookPreference, () => false);

    const openRulebook = () => {
        setOpen(true);
        saveRulebookPreference(preferenceKey);
    };
    const chapterNumber = String(activePageIndex + 1).padStart(2, '0');

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);

    return (
        <>
            <div className="flex items-center gap-2">
                {hasSeenRulebook === false && (
                    <span className="rounded-md border border-accent/25 bg-accent/5 px-2.5 py-1.5 text-[10px] font-medium leading-4 text-lime-100">
                        {t('manage.rulebook.badge.startHere')}
                    </span>
                )}
                <button
                    type="button"
                    onClick={openRulebook}
                    aria-label={hasSeenRulebook === false ? t('manage.rulebook.button.ariaStartHere') : t('manage.rulebook.button.ariaOpen')}
                    aria-describedby={hasSeenRulebook === false ? 'scoring-rulebook-hint' : undefined}
                    title={t('manage.rulebook.title')}
                    className={`relative grid size-9 shrink-0 place-items-center rounded-md border bg-canvas text-lime-200 transition hover:border-accent/50 hover:bg-accent/5 hover:text-lime-100 ${hasSeenRulebook === false
                            ? 'border-accent/70 shadow-[0_0_22px_rgba(163,230,53,0.3)] animate-pulse'
                            : 'border-line'
                        }`}
                >
                    <FiBookOpen aria-hidden="true" />
                    {hasSeenRulebook === false && (
                        <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-canvas bg-accent" />
                    )}
                </button>
                {hasSeenRulebook === false && (
                    <span id="scoring-rulebook-hint" className="sr-only">
                        {t('manage.rulebook.button.hint')}
                    </span>
                )}
            </div>
            {open && (
                <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="scoring-rulebook-title" className="panel flex h-[min(84vh,720px)] w-full max-w-5xl flex-col overflow-hidden shadow-2xl">
                        <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-4 sm:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="grid size-10 shrink-0 place-items-center rounded-md border border-accent/25 bg-accent/8 text-lime-200"><FiBookOpen aria-hidden="true" /></span>
                                <div className="min-w-0">
                                    <p className="eyebrow">Gigsona · {t('manage.rulebook.fieldGuide')}</p>
                                    <h2 id="scoring-rulebook-title" className="mt-0.5 truncate text-lg font-semibold text-ink">{t('manage.rulebook.title')}</h2>
                                </div>
                            </div>
                            <button type="button" onClick={() => setOpen(false)} aria-label={t('manage.rulebook.button.ariaClose')} title={t('manage.common.close')} className="grid size-9 shrink-0 place-items-center rounded-md border border-line text-muted transition hover:border-neutral-600 hover:text-ink">
                                <FiX aria-hidden="true" />
                            </button>
                        </header>

                        <div className="grid min-h-0 flex-1 md:grid-cols-[190px_minmax(0,1fr)]">
                            <nav aria-label={t('manage.rulebook.chapters')} className="flex gap-1 overflow-x-auto border-b border-line p-2 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:p-3">
                                {rulebookPages.map((page, index) => (
                                    <button key={page.id} type="button" onClick={() => setActivePageIndex(index)} aria-current={activePageIndex === index ? 'step' : undefined} className={`flex min-w-max items-center gap-2 rounded px-3 py-2 text-left text-xs transition md:w-full ${activePageIndex === index ? 'bg-accent/10 text-lime-200' : 'text-faint hover:bg-white/4 hover:text-ink'}`}>
                                        <span className={`font-mono text-[10px] ${activePageIndex === index ? 'text-accent' : 'text-neutral-700'}`}>{String(index + 1).padStart(2, '0')}</span>
                                        {t(page.labelKey)}
                                    </button>
                                ))}
                            </nav>

                            <main aria-live="polite" className="flex min-h-0 flex-col overflow-y-auto p-4 sm:p-6">
                                <div className="mb-5 flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">{t('manage.rulebook.chapter', { number: chapterNumber })}</p>
                                        <h3 className="mt-1 text-xl font-semibold text-ink sm:text-2xl">{t(rulebookPages[activePageIndex].titleKey)}</h3>
                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{t(rulebookPages[activePageIndex].summaryKey)}</p>
                                    </div>
                                    <span className="hidden shrink-0 font-mono text-5xl font-light text-neutral-800 sm:block">{chapterNumber}</span>
                                </div>

                                <RulebookIllustration page={rulebookPages[activePageIndex].id} />

                                <footer className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
                                    <span className="text-[11px] text-faint">{activePageIndex + 1} / {rulebookPages.length}</span>
                                    <div className="flex gap-2">
                                        <button type="button" disabled={activePageIndex === 0} onClick={() => setActivePageIndex((index) => Math.max(0, index - 1))} className="h-9 rounded border border-line px-3 text-xs text-muted transition hover:border-neutral-600 disabled:cursor-not-allowed disabled:opacity-35">{t('manage.rulebook.navigation.previous')}</button>
                                        {activePageIndex < rulebookPages.length - 1 ? (
                                            <button type="button" onClick={() => setActivePageIndex((index) => Math.min(rulebookPages.length - 1, index + 1))} className="inline-flex h-9 items-center gap-2 rounded bg-accent px-3 text-xs font-semibold text-accent-ink transition hover:bg-lime-200">{t('manage.rulebook.navigation.next')} <FiArrowRight aria-hidden="true" /></button>
                                        ) : (
                                            <button type="button" onClick={() => setOpen(false)} className="h-9 rounded bg-accent px-3 text-xs font-semibold text-accent-ink transition hover:bg-lime-200">{t('manage.rulebook.navigation.backToSheet')}</button>
                                        )}
                                    </div>
                                </footer>
                            </main>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
