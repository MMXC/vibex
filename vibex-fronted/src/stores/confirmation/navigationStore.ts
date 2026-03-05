// Navigation Store - manages current step and navigation

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ConfirmationStep } from './types'

const STORAGE_KEY = 'confirmation-navigation'

export interface NavigationState {
  currentStep: ConfirmationStep
  stepHistory: ConfirmationStep[]
}

export interface NavigationActions {
  setCurrentStep: (step: ConfirmationStep) => void
  goToNextStep: () => void
  goToPreviousStep: () => void
}

export type NavigationStore = NavigationState & NavigationActions

const initialState: NavigationState = {
  currentStep: 'input',
  stepHistory: [],
}

export const useNavigationStore = create<NavigationStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setCurrentStep: (step) => {
        const current = get().currentStep
        set(state => ({
          currentStep: step,
          stepHistory: [...state.stepHistory, current]
        }))
      },
      
      goToNextStep: () => {
        const { currentStep } = get()
        const stepOrder: ConfirmationStep[] = ['input', 'context', 'model', 'flow', 'success']
        const currentIndex = stepOrder.indexOf(currentStep)
        if (currentIndex < stepOrder.length - 1) {
          const nextStep = stepOrder[currentIndex + 1]
          set(state => ({
            currentStep: nextStep,
            stepHistory: [...state.stepHistory, currentStep]
          }))
        }
      },
      
      goToPreviousStep: () => {
        const { stepHistory } = get()
        if (stepHistory.length > 0) {
          const previousStep = stepHistory[stepHistory.length - 1]
          set({
            currentStep: previousStep,
            stepHistory: stepHistory.slice(0, -1)
          })
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
)
