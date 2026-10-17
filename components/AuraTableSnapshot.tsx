'use client';

import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import { AuraSnapshotTable } from './AuraSnapshotTable';
import { toBlob } from 'html-to-image';
import { FiCamera, FiCheck, FiDownload, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { useRegion } from '@/components/RegionSetting';
import { useT } from '@/lib/i18n/use-t';
import { AuraCategory } from '@/types/types';

interface StudentData {
    id: number;
    displayName: string | null;
}

interface AuraTableSnapshotProps {
    groupName: string;
    lessonDate: string;
    students: StudentData[];
    categories: AuraCategory[];
    auraMap: number[];
    isSaving?: boolean;
    onBeforeCapture?: () => Promise<void> | void;
    renderTrigger?: (actions: {
        copyPhoto: () => Promise<void>;
        downloadPhoto: () => Promise<void>;
        captureStatus: 'idle' | 'capturing' | 'copied' | 'downloaded' | 'error';
    }) => React.ReactNode;
}

function formatLessonDate(lessonDate: string, locale: string): string {
    const date = new Date(`${lessonDate}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return lessonDate;
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    }).format(date);
}

export function AuraTableSnapshot({
    groupName,
    lessonDate,
    students,
    categories,
    auraMap,
    isSaving = false,
    onBeforeCapture,
    renderTrigger,
}: AuraTableSnapshotProps) {
    const t = useT();
    const { locale } = useRegion();
    const copyButtonId = useId();
    const downloadButtonId = useId();
    const tableRef = useRef<HTMLDivElement | null>(null);
    const [captureStatus, setCaptureStatus] = useState<'idle' | 'capturing' | 'copied' | 'downloaded' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const formattedLessonDate = formatLessonDate(lessonDate, locale);

    const setTemporaryStatus = useCallback((status: 'copied' | 'downloaded' | 'error', message = '') => {
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        setCaptureStatus(status);
        setErrorMessage(message);
        statusTimeoutRef.current = setTimeout(() => {
            setCaptureStatus('idle');
            setErrorMessage('');
        }, 3200);
    }, []);

    const triggerDownload = useCallback((blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, []);

    const handleCapture = useCallback(async (forceDownload = false) => {
        if (captureStatus === 'capturing' || students.length === 0) return;

        try {
            setCaptureStatus('capturing');
            setErrorMessage('');

            if (onBeforeCapture) {
                await onBeforeCapture();
            }

            const exportElement = tableRef.current;
            if (!exportElement) {
                throw new Error(t('profile.snapshot.errorExportNotReady'));
            }

            // Wait a brief tick for DOM and layout to be completely settled
            await new Promise((resolve) => setTimeout(resolve, 60));

            const blob = await toBlob(exportElement, {
                pixelRatio: 2, // High DPI for crisp text on retina screens and mobile chat previews
                skipFonts: true,
                backgroundColor: '#0c0c0e',
                cacheBust: true,
            });

            if (!blob) {
                throw new Error(t('profile.snapshot.errorGenerateImage'));
            }

            const sanitizedGroupName = groupName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
            const filename = `${sanitizedGroupName}_${lessonDate}_aura_sheet.png`;

            if (forceDownload) {
                triggerDownload(blob, filename);
                setTemporaryStatus('downloaded');
                return;
            }

            // Try copying directly to clipboard
            let copiedSuccessfully = false;
            if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
                try {
                    const clipboardItem = new ClipboardItem({
                        'image/png': blob,
                    });
                    await navigator.clipboard.write([clipboardItem]);
                    copiedSuccessfully = true;
                } catch (clipboardErr) {
                    console.warn('ClipboardItem write rejected, attempting download fallback:', clipboardErr);
                }
            }

            if (copiedSuccessfully) {
                setTemporaryStatus('copied');
            } else {
                // Browser security / permissions restricted clipboard access; fallback to automatic download
                triggerDownload(blob, filename);
                setTemporaryStatus('downloaded', t('profile.snapshot.errorClipboardBlocked'));
            }
        } catch (err) {
            console.error('Error taking snapshot of table:', err);
            setTemporaryStatus('error', err instanceof Error ? err.message : t('profile.snapshot.errorGeneric'));
        }
    }, [captureStatus, groupName, lessonDate, onBeforeCapture, setTemporaryStatus, students.length, t, triggerDownload]);

    const copyPhoto = useCallback(async () => {
        document.getElementById(copyButtonId)?.click();
    }, [copyButtonId]);

    const downloadPhoto = useCallback(async () => {
        document.getElementById(downloadButtonId)?.click();
    }, [downloadButtonId]);

    const triggerActions = useMemo(() => ({
        copyPhoto,
        downloadPhoto,
        captureStatus,
    }), [captureStatus, copyPhoto, downloadPhoto]);

    return (
        <>
            {/* Action Buttons */}
            {renderTrigger ? (
                <>
                    <div className="hidden" aria-hidden="true">
                        <button
                            id={copyButtonId}
                            type="button"
                            onClick={() => void handleCapture(false)}
                            disabled={captureStatus === 'capturing' || students.length === 0 || isSaving}
                        />
                        <button
                            id={downloadButtonId}
                            type="button"
                            onClick={() => void handleCapture(true)}
                            disabled={captureStatus === 'capturing' || students.length === 0 || isSaving}
                        />
                    </div>
                    {renderTrigger(triggerActions)}
                </>
            ) : (
                <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => void handleCapture(false)}
                    disabled={captureStatus === 'capturing' || students.length === 0 || isSaving}
                    title={t('profile.snapshot.copyTitle')}
                    className={`btn btn-sm inline-flex items-center gap-2 transition-all duration-200 ${captureStatus === 'copied'
                        ? 'border border-accent/60 bg-accent/20 text-lime-200 font-semibold'
                        : captureStatus === 'downloaded'
                            ? 'border border-cyan-400/60 bg-cyan-400/20 text-cyan-200 font-semibold'
                            : captureStatus === 'error'
                                ? 'border border-danger/60 bg-danger/20 text-rose-200 font-semibold'
                                : 'btn-secondary text-ink hover:border-accent/60 hover:text-lime-200'
                        }`}
                >
                    {captureStatus === 'capturing' ? (
                        <>
                            <FiLoader className="size-3.5 animate-spin text-lime-300" />
                            <span>{t('profile.snapshot.capturing')}</span>
                        </>
                    ) : captureStatus === 'copied' ? (
                        <>
                            <FiCheck className="size-3.5 text-accent stroke-3" />
                            <span>{t('profile.snapshot.copied')}</span>
                        </>
                    ) : captureStatus === 'downloaded' ? (
                        <>
                            <FiCheck className="size-3.5 text-cyan-300 stroke-3" />
                            <span>{t('profile.snapshot.downloaded')}</span>
                        </>
                    ) : captureStatus === 'error' ? (
                        <>
                            <FiAlertCircle className="size-3.5 text-rose-300" />
                            <span>{t('profile.snapshot.failed')}</span>
                        </>
                    ) : (
                        <>
                            <FiCamera className="size-3.5 text-accent" />
                            <span>{t('profile.snapshot.copyTablePhoto')}</span>
                        </>
                    )}
                </button>

                {/* Secondary Download Button */}
                <button
                    type="button"
                    onClick={() => void handleCapture(true)}
                    disabled={captureStatus === 'capturing' || students.length === 0 || isSaving}
                    title={t('profile.snapshot.downloadTitle')}
                    aria-label={t('profile.snapshot.downloadAria')}
                    className="btn btn-secondary btn-sm size-9 p-0 text-muted hover:border-accent/60 hover:text-lime-200 transition-colors"
                >
                    <FiDownload className="size-3.5" />
                </button>
            </div>
            )}

            {/* Floating Toast Notification */}
            {captureStatus === 'copied' && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed bottom-6 right-6 z-150 flex items-center gap-3 rounded-xl border border-accent/60 bg-surface px-4 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(163,230,53,0.15)] text-xs text-ink transition-all animate-in fade-in slide-in-from-bottom-3"
                >
                    <span className="grid size-6 place-items-center rounded-full bg-accent/20 text-accent">
                        <FiCheck className="size-3.5 stroke-3" />
                    </span>
                    <div>
                        <p className="font-semibold text-lime-200">{t('profile.snapshot.toastCopiedTitle')}</p>
                        <p className="text-[11px] text-faint">
                            {t('profile.snapshot.toastCopiedHintPrefix')} <kbd className="rounded border border-line bg-canvas px-1 py-0.5 font-mono text-[10px] text-ink">⌘V</kbd> {t('profile.snapshot.toastCopiedHintConnector')} <kbd className="rounded border border-line bg-canvas px-1 py-0.5 font-mono text-[10px] text-ink">Ctrl+V</kbd> {t('profile.snapshot.toastCopiedHintSuffix')}
                        </p>
                    </div>
                </div>
            )}
            {captureStatus === 'downloaded' && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed bottom-6 right-6 z-150 flex items-center gap-3 rounded-xl border border-cyan-400/60 bg-surface px-4 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(103,232,249,0.15)] text-xs text-ink transition-all animate-in fade-in slide-in-from-bottom-3"
                >
                    <span className="grid size-6 place-items-center rounded-full bg-cyan-400/20 text-cyan-300">
                        <FiCheck className="size-3.5 stroke-3" />
                    </span>
                    <div>
                        <p className="font-semibold text-cyan-200">{t('profile.snapshot.toastDownloadedTitle')}</p>
                        <p className="text-[11px] text-faint">{errorMessage || t('profile.snapshot.savedDownloads')}</p>
                    </div>
                </div>
            )}

            <AuraSnapshotTable
                tableRef={tableRef}
                groupName={groupName}
                formattedLessonDate={formattedLessonDate}
                students={students}
                categories={categories}
                auraMap={auraMap}
            />
        </>
    );
}