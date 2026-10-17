'use client';

import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/use-t';

export function OverviewDatePicker({ value, max }: { value: string; max: string }) {
    const router = useRouter();
    const t = useT();
    return (
        <input
            type="date"
            value={value}
            max={max}
            aria-label={t('overview.datePicker.ariaLabel')}
            onChange={(event) => {
                if (event.target.value) router.push(`/?date=${event.target.value}`);
            }}
            className="field w-auto"
        />
    );
}
