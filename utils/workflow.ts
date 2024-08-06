// Representation of the entire workflow end-to-end.
//
// Workflows are represented as a sequence of steps, each of which is further
// broken down into one or more tasks. From the workflow's perspective, a task
// is the smallest atomic unit of work.
export type Workflow = {
  uuid: string
  init: InitSchema
  actions: ActionForm[]
}

export type TaskResult = {
  status: "SUCCESS" | "FAILURE" | "SKIPPED" | "NEEDS_CONFIRMATION"
  message?: string
  // A list of key/value pairs. Use a list instead of a `Map` because the
  // latter isn't serializable. This would otherwise make communicating results
  // through message passing impossible.
  params?: [string, string][]
}

// A collection of task results. A step is considered successful if none of its
// tasks failed (notice this is different from each task succeeding).
export class StepResult {
  private _results: TaskResult[]

  constructor(results?: TaskResult[]) {
    this._results = results ?? []
  }

  get status() {
    for (let i = this._results.length - 1; i >= 0; --i) {
      if (this._results[i].status === "FAILURE") {
        return "FAILURE"
      }
    }
    return "SUCCESS"
  }

  get params() {
    return this._results.reduce((prev, curr) => {
      for (const [key, val] of curr.params ?? []) {
        prev.set(key, val)
      }
      return prev
    }, new Map())
  }

  get tasks() {
    return this._results.map((task) => ({ ...task }))
  }
}
