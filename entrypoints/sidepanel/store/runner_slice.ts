import {
  type Workflow,
  StepResult,
  StepStatus,
  TaskStatus,
  TaskResult,
  getStepResultParams,
  getStepResultStatus,
} from "@/utils/workflow"
import { type SharedStateCreator } from "./index"
import { queryTabs } from "@/utils/browser_tabs"

export type RunnerSlice = {
  runnerActive: Workflow | null
  runnerTabId: number | null
  runnerStepIndex: number
  runnerTaskIndex: number
  runnerResults: StepResult[]

  runnerActions: {
    startWorkflow: (workflow: Workflow) => Promise<void>
    isFinished: () => boolean
    getParams: () => Map<string, string>
    getStatus: () => StepStatus
    popTaskResult: () => void
    pushTaskResult: (result: TaskResult) => void
  }
}

export const runnerSlice: SharedStateCreator<RunnerSlice> = (set, get) => ({
  runnerActive: null,
  runnerTabId: null,
  runnerStepIndex: -1,
  runnerTaskIndex: -1,
  runnerResults: [],

  runnerActions: {
    startWorkflow: async (workflow) => {
      const tabs = await queryTabs({ active: true, currentWindow: true })
      set({
        sharedActiveTab: "runner",
        runnerActive: workflow,
        runnerStepIndex: 0,
        runnerTaskIndex: 0,
        runnerResults: [],
        runnerTabId: tabs[0].id ?? null,
      })
    },

    isFinished: () => {
      const active = get().runnerActive
      if (active === null || get().runnerTabId === null) {
        return true
      }
      return get().runnerStepIndex >= active.steps.length
    },

    getParams: () => {
      const params = new Map()
      get().runnerResults.forEach((result) => {
        for (const [key, val] of getStepResultParams(result).entries()) {
          params.set(key, val)
        }
      })
      return params
    },

    getStatus: () => {
      const step = get().runnerResults[get().runnerStepIndex]
      if (!step) {
        return StepStatus.SUCCEEDED
      }
      return getStepResultStatus(step)
    },

    popTaskResult: () => {
      const active = get().runnerActive
      if (!active) {
        console.error("Pushing task result with no active workflow set.")
        return
      }

      set((s) => {
        s.runnerResults[s.runnerStepIndex]?.results?.pop()
      })
    },

    pushTaskResult: (result: TaskResult) => {
      const active = get().runnerActive
      if (!active) {
        console.error("Pushing task result with no active workflow set.")
        return
      }

      let stepIndex = get().runnerStepIndex
      let taskIndex = get().runnerTaskIndex

      const step = active.steps[stepIndex]
      const kind = step.kind
      switch (kind) {
        case StepKind.EXTRACTING: {
          if (taskIndex >= step.values.params.length - 1) {
            stepIndex += 1
            taskIndex = 0
          } else {
            taskIndex += 1
          }
          break
        }
        case StepKind.INJECTING: {
          if (taskIndex >= step.values.targets.length - 1) {
            stepIndex += 1
            taskIndex = 0
          } else {
            taskIndex += 1
          }
          break
        }
        case StepKind.NAVIGATE: {
          stepIndex += 1
          taskIndex = 0
          break
        }
        case StepKind.OPENAI: {
          stepIndex += 1
          taskIndex = 0
          break
        }
        case StepKind.PROMPT: {
          stepIndex += 1
          taskIndex = 0
          break
        }
        case StepKind.RECORDING: {
          if (taskIndex >= step.values.recordings.length - 1) {
            stepIndex += 1
            taskIndex = 0
          } else {
            taskIndex += 1
          }
          break
        }
        default: {
          stepIndex = kind // never
          break
        }
      }

      set((s) => {
        s.runnerResults[s.runnerStepIndex] = {
          results: [
            ...(s.runnerResults[s.runnerStepIndex]?.results ?? []),
            result,
          ],
        }
        if (result.status !== TaskStatus.PAUSED) {
          s.runnerStepIndex = stepIndex
          s.runnerTaskIndex = taskIndex
        }
      })
    },
  },
})
