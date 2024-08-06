import React from "react"
import { immer } from "zustand/middleware/immer"
import { create } from "zustand"

import { StepResult } from "@/utils/workflow"

export type RunnerState = {
  workflow: Workflow
  browserTabId: number
  taskIndex: number
  stepIndex: number
  results: StepResult[]

  actions: {
    isFinished: () => boolean
    getParams: () => Map<string, string>
    getTaskResult: () => TaskResult
    getStepResult: () => StepResult
  }
}

export const createRunnerStore = (options: {
  workflow: Workflow
  browserTabId: number
}) => {
  return create<RunnerState>()(
    immer((set, get, _api) => ({
      workflow: options.workflow,
      browserTabId: options.browserTabId,
      taskIndex: -1,
      stepIndex: -1,
      results: [],

      actions: {
        isFinished: () => {
          return get().stepIndex >= get().workflow.steps.length
        },

        getParams: () => {
          const params = new Map()
          get().results.forEach((result) => {
            for (const [key, val] of result.params.entries()) {
              params.set(key, val)
            }
          })
          return params
        },

        getTaskResult: () => {
          return get().results[get().stepIndex]?.tasks[get().taskIndex]
        },

        getStepResult: () => {
          return get().results[get().stepIndex]
        },
      },
    }))
  )
}

export type RunnerStore = ReturnType<typeof createRunnerStore>
