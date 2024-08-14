import {
  type Workflow,
  type StepResult,
  type TaskResult,
  StepStatus,
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
    // Until we support running workflows in parallel, every action should take
    // in a workflow to be used as a guard. If the passed workflow does not
    // match the active workflow, the action should be a no-op or return a
    // reasonable default.
    //
    // TODO: Extend `runnerActive` to `runnerActives`.
    isFinished: (workflow: Workflow) => boolean
    isPaused: (workflow: Workflow) => boolean
    getParams: (workflow: Workflow) => Map<string, string>
    getStatus: (workflow: Workflow) => StepStatus
    popTaskResult: (workflow: Workflow) => TaskResult | null
    pushTaskResult: (workflow: Workflow, result: TaskResult) => void
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

    isFinished: (workflow) => {
      const active = get().runnerActive
      if (active?.uuid !== workflow.uuid || get().runnerTabId === null) {
        return true
      }

      return (
        get().runnerActions.getStatus(workflow) === StepStatus.FAILED ||
        get().runnerStepIndex >= active.steps.length
      )
    },

    isPaused: (workflow) => {
      if (get().runnerActive?.uuid !== workflow.uuid) {
        return false
      }

      const step = get().runnerResults[get().runnerStepIndex]
      if (!step) {
        return false
      }

      return step.isPaused ?? false
    },

    getParams: (workflow) => {
      const params = new Map()
      if (get().runnerActive?.uuid !== workflow.uuid) {
        return params
      }

      get().runnerResults.forEach((result) => {
        for (const [key, val] of getStepResultParams(result).entries()) {
          params.set(key, val)
        }
      })

      return params
    },

    getStatus: (workflow) => {
      if (get().runnerActive?.uuid !== workflow.uuid) {
        return StepStatus.FAILED
      }

      const step = get().runnerResults[get().runnerStepIndex]
      if (!step) {
        return StepStatus.SUCCEEDED
      }

      return getStepResultStatus(step)
    },

    popTaskResult: (workflow) => {
      const active = get().runnerActive
      if (active?.uuid !== workflow.uuid) {
        return null
      }

      const latest =
        get().runnerResults[get().runnerStepIndex]?.results?.[
          get().runnerTaskIndex
        ]

      set((s) => {
        s.runnerResults[s.runnerStepIndex]?.results?.pop()
      })

      return latest ?? null
    },

    pushTaskResult: (workflow, result) => {
      const active = get().runnerActive
      if (active?.uuid !== workflow.uuid) {
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
        case StepKind.INPUT: {
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
        if (!result.isPaused && result.status !== TaskStatus.FAILED) {
          s.runnerStepIndex = stepIndex
          s.runnerTaskIndex = taskIndex
        }
      })
    },
  },
})
