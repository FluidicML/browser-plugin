import { type Workflow, StepResult } from "@/utils/workflow"
import { type SharedStateCreator } from "./index"

export type RunnerSlice = {
  runnerActive: Workflow | null
  runnerTabId: number
  runnerTaskIndex: number
  runnerStepIndex: number
  runnerResults: StepResult[]

  runnerActions: {
    startWorkflow: (workflow: Workflow) => void
    isFinished: () => boolean
    getParams: () => Map<string, string>
    getTaskResult: () => TaskResult | null
    getStepResult: () => StepResult | null
  }
}

export const runnerSlice: SharedStateCreator<RunnerSlice> = (set, get) => ({
  runnerActive: null,
  runnerTabId: -1,
  runnerTaskIndex: -1,
  runnerStepIndex: -1,
  runnerResults: [],

  runnerActions: {
    startWorkflow: (workflow) => {
      set({ sharedActiveTab: "runner", runnerActive: workflow })
    },

    isFinished: () => {
      const active = get().runnerActive
      if (!active) {
        return false
      }
      return get().runnerStepIndex >= active.steps.length
    },

    getParams: () => {
      const params = new Map()
      get().runnerResults.forEach((result) => {
        for (const [key, val] of result.params.entries()) {
          params.set(key, val)
        }
      })
      return params
    },

    getTaskResult: () => {
      return (
        get().runnerResults[get().runnerStepIndex]?.tasks[
          get().runnerTaskIndex
        ] ?? null
      )
    },

    getStepResult: () => {
      return get().runnerResults[get().runnerStepIndex] ?? null
    },
  },
})
