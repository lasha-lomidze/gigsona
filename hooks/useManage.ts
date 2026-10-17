import { useState } from 'react';

export type SelectionState = 'deselected' | 'selected' | 'chosen';

interface UseManageProps {
    studentsCount: number;
    categoriesCount: number;
    initialAuraMap?: number[];
}

export const useManage = ({ studentsCount, categoriesCount, initialAuraMap }: UseManageProps) => {
    const totalCells = studentsCount * categoriesCount;

    const [selectionMap, setSelectionMap] = useState<SelectionState[]>(
        Array(totalCells).fill('deselected')
    );

    const [auraMap, setAuraMap] = useState<number[]>(() => initialAuraMap ?? Array(totalCells).fill(0));

    return {
        selectionMap,
        setSelectionMap,
        auraMap,
        setAuraMap,
    };
};
