'use client';

import { useEffect, useState } from 'react';
import { FiArrowUp } from 'react-icons/fi';
import { useT } from '@/lib/i18n/use-t';

export function HistoryBackToTop() {
    const t = useT();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const scrollContainer = document.querySelector<HTMLElement>('main');
        if (!scrollContainer) return;

        const updateVisibility = () => setVisible(scrollContainer.scrollTop > 3400);

        updateVisibility();
        scrollContainer.addEventListener('scroll', updateVisibility, { passive: true });
        return () => scrollContainer.removeEventListener('scroll', updateVisibility);
    }, []);

    if (!visible) return null;

    return (
        <button
            type="button"
            aria-label={t('history.backToTop.label')}
            title={t('history.backToTop.label')}
            onClick={() => {
                document.querySelector<HTMLElement>('main')?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="fixed right-10 bottom-10 z-50 grid size-12 place-items-center rounded-full border border-accent/50 bg-surface/95 text-accent shadow-[0_8px_28px_rgba(0,0,0,0.55),0_0_16px_rgba(163,230,53,0.12)] transition hover:border-accent hover:bg-surface hover:text-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
            <FiArrowUp aria-hidden="true" className="size-7" />
        </button>
    );
}
