// Representation of the entire workflow end-to-end.
//
// Workflows are represented as a sequence of steps, each of which may be
// further broken down into one or more tasks.
export type Workflow = {
  uuid: string
  init: InitSchema
  actions: ActionForm[]
}

export type TaskResult = {
  // Representation of the given task result.
  status: "SUCCESS" | "FAILURE" | "SKIPPED" | "NEEDS_CONFIRMATION"
  // A message returned from the content script.
  message?: string
  // A list of key value pairs. Note we use a list instead of a `Map` because
  // the latter isn't serializable. This would otherwise make communicating
  // results through message passing impossible.
  params?: [string, string][]
}

// Corresponds to a collection of tasks. A step is considered successful
// provided each nested task did not fail.
export class StepResult {
  private _tasks: TaskResult[]
  private _messages: string[]
  private _params: Map<string, string>
  private _status: "SUCCESS" | "FAILURE"

  constructor(options?: {
    status?: "SUCCESS" | "FAILURE"
    messages?: string[]
    params?: Map<string, string>
  }) {
    this._tasks = []
    this._messages = [...(options?.messages ?? [])]
    this._params = new Map([...(options?.params ?? [])])
    this._status = options?.status ?? "SUCCESS"
  }

  get messages() {
    return this._messages
  }

  get status() {
    return this._status
  }

  get params() {
    return this._params
  }

  pushTaskResult(task: TaskResult) {
    this._tasks.push(task)
    if (this._status === "SUCCESS" && task.status === "FAILURE") {
      this._status = "FAILURE"
    }
    this._messages = [
      ...this._messages,
      ...(task.message ? [task.message] : []),
    ]
    this._params = new Map([...this._params, ...(task.params ?? [])])
  }
}
