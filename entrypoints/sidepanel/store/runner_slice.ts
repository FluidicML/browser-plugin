import type { Workflow } from "@/utils/workflow"
import { type SharedStateCreator } from "./index"

export type RunnerSlice = {
  runnerActive: Workflow | null

  runnerActions: {
    startWorkflow: (workflow: Workflow) => void
  }
}

export const runnerSlice: SharedStateCreator<RunnerSlice> = (set) => ({
  runnerActive: null,

  runnerActions: {
    startWorkflow: (workflow) => {
      set({ sharedActiveTab: "runner", runnerActive: workflow })
    },
  },
})
