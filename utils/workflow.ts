export type StepResult = {
  success: boolean
  messages?: string[]
  // Use a list instead of `Map` since the latter isn't serializable. This
  // would otherwise make communicating `StepResult`s with message passing
  // impossible.
  params?: [string, string][]
}

export const mergeStepResults = (a: StepResult, b: StepResult): StepResult => {
  const merged: StepResult = {
    success: a.success && b.success,
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
