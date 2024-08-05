export type StepResult = {
  // We return a `null` value if our step fails but success is optional.
  // Otherwise return true or false.
  success: boolean | null
  // A list of messages to return from the content script. These are displayed
  // under each step.
  messages?: string[]
  // Use a list instead of `Map` since the latter isn't serializable. This
  // would otherwise make communicating `StepResult`s with message passing
  // impossible.
  params?: [string, string][]
}

export const mergeStepResults = (a: StepResult, b: StepResult): StepResult => {
  const merged: StepResult = {
    success:
      a.success && b.success
        ? true
        : a.success !== false && b.success !== false
          ? null
          : false,
  }
  if (a.messages || b.messages) {
    merged.messages = [...(a.messages ?? []), ...(b.messages ?? [])]
  }
  if (a.params || b.params) {
    const uniq = new Map([...(a.params ?? []), ...(b.params ?? [])])
    merged.params = [...uniq]
  }
  return merged
}

// Representation of the entire workflow end-to-end.
export type Workflow = {
  uuid: string
  init: InitSchema
  actions: ActionForm[]
}
