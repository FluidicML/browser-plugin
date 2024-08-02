export type StepResult = {
  success: boolean
  messages?: string[]
  args?: Map<string, string>
}

export const mergeStepResults = (a: StepResult, b: StepResult) => {
  const merged: StepResult = {
    success: a.success || b.success,
    messages: [...(a.messages ?? []), ...(b.messages ?? [])],
  }

  if (a.args && b.args) {
    if (a.args) {
      merged.args = a.args
    }
    if (b.args) {
      if (merged.args) {
        for (const [k, v] of b.args.entries()) {
          merged.args.set(k, v)
        }
      } else {
        merged.args = b.args
      }
    }
  }

  return merged
}

// Representation of the entire workflow end-to-end.
export type Workflow = {
  uuid: string
  init: InitSchema
  actions: ActionForm[]
}
