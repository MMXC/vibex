// Model Store - manages domain models

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DomainModel } from './types'

const STORAGE_KEY = 'confirmation-model'

export interface ModelState {
  domainModels: DomainModel[]
  modelMermaidCode: string
}

export interface ModelActions {
  setDomainModels: (models: DomainModel[]) => void
  setModelMermaidCode: (code: string) => void
}

export type ModelStore = ModelState & ModelActions

const initialState: ModelState = {
  domainModels: [],
  modelMermaidCode: '',
}

export const useModelStore = create<ModelStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setDomainModels: (models) => set({ domainModels: models }),
      setModelMermaidCode: (code) => set({ modelMermaidCode: code }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
)
