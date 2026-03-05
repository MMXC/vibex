// Input Store - manages requirement text input

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const STORAGE_KEY = 'confirmation-input'

export interface InputState {
  requirementText: string
}

export interface InputActions {
  setRequirementText: (text: string) => void
}

export type InputStore = InputState & InputActions

const initialState: InputState = {
  requirementText: '',
}

export const useInputStore = create<InputStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setRequirementText: (text) => set({ requirementText: text }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
)
