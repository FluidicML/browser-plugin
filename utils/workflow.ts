export type StepResult = {
  success: boolean
  messages?: string[]
  args?: Map<string, string>
}

// Representation of the entire workflow end-to-end.
export type Workflow = {
  uuid: string
  init: InitSchema
  actions: ActionForm[]
}
