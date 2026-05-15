
import { create } from 'zustand'
import { ModalView } from '../types/types'

interface GlobalState {
    // UI State
    modalOpen: ModalView
    setModal: (val: ModalView) => void

}

export const useStore = create<GlobalState>((set) => ({
    // Initial Values
    modalOpen: null,

    // Actions
    setModal: (val) => set({ modalOpen: val }),

}))