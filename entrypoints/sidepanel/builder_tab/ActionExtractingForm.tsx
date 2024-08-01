import React from "react"

import type { ActionExtractingSchema, ActionForm } from "@/utils/workflow"

type ActionExtractingFormProps = {
  onChange: (values: ActionForm | null) => void
}

const ActionExtractingForm = ({ onChange }: ActionExtractingFormProps) => {
  return <div />
}
ActionExtractingForm.displayName = "ActionExtractingForm"

export default ActionExtractingForm
