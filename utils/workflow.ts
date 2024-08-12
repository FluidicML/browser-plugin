import { InitSchema, type Step } from "./schema"

// Workflows are represented as a sequence of steps, each of which is further
// broken down into one or more tasks. From the workflow's perspective, a task
// is the smallest atomic unit of work.
export type Workflow = {
  uuid: string
  init: InitSchema
  steps: Step[]
}

export enum TaskStatus {
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  SKIPPED = "skipped",
}

export type TaskResult = {
  status: TaskStatus
  message?: string
  // A list of key/value pairs. Use a list instead of a `Map` because the
  // latter isn't serializable. This would otherwise make communicating results
  // through message passing impossible.
  params?: [string, string][]
  // Indicates the workflow has stopped execution. User interaction is required
  // to continue.
  isPaused?: boolean
}

export enum StepStatus {
  SUCCEEDED = "succeeded",
  FAILED = "failed",
}

// A collection of task results. A step is considered successful if none of its
// tasks failed (notice this is different from each task succeeding).
export type StepResult = {
  results: TaskResult[]
  isPaused?: boolean
}

export const getStepResultStatus = (result: StepResult): StepStatus => {
  for (let i = result.results.length - 1; i >= 0; --i) {
    const status = result.results[i].status
    if (status === TaskStatus.FAILED) {
      return StepStatus.FAILED
    }
  }
  return StepStatus.SUCCEEDED
}

export const getStepResultParams = (result: StepResult) => {
  return result.results.reduce((prev, curr) => {
    for (const [key, val] of curr.params ?? []) {
      prev.set(key, val)
    }
    return prev
  }, new Map())
}
