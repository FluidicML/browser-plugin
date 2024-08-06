import { type Step } from "./schema"

// Representation of the entire workflow end-to-end.
//
// Workflows are represented as a sequence of steps, each of which is further
// broken down into one or more tasks. From the workflow's perspective, a task
// is the smallest atomic unit of work.
export type Workflow = {
  uuid: string
  init: InitSchema
  steps: Step[]
}

export type TaskResult = {
  status: "SUCCESS" | "FAILURE" | "SKIPPED"
  message?: string
  // A list of key/value pairs. Use a list instead of a `Map` because the
  // latter isn't serializable. This would otherwise make communicating results
  // through message passing impossible.
  params?: [string, string][]
}

// A collection of task results. A step is considered successful if none of its
// tasks failed (notice this is different from each task succeeding).
export type StepResult = {
  results: TaskResult[]
}

export const getStepResultStatus = (
  result: StepResult
): "SUCCESS" | "FAILURE" => {
  for (let i = result.results.length - 1; i >= 0; --i) {
    if (result.results[i].status === "FAILURE") {
      return "FAILURE"
    }
  }
  return "SUCCESS"
}

export const getStepResultParams = (result: StepResult) => {
  return result.results.reduce((prev, curr) => {
    for (const [key, val] of curr.params ?? []) {
      prev.set(key, val)
    }
    return prev
  }, new Map())
}
