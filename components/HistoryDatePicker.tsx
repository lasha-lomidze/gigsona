'use client';

import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/use-t';

export function HistoryDatePicker({ groupId, value, max }: { groupId: number; value: string; max: string }) {
    const router = useRouter();
    const t = useT();
    return (
        <input
            type="date"
            value={value}
            max={max}
            aria-label={t('history.datePicker.chooseDate')}
            onChange={(event) => {
                if (event.target.value) router.push(`/history?group=${groupId}&date=${event.target.value}`);
            }}
            className="field btn-sm w-auto"
        />
    );
}
