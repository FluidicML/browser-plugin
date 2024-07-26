import React from "react"

import ComboBox from "@/components/ui/combobox"

enum Action {
  CLICK = "click",
  NAVIGATE = "navigate",
  PROMPT = "prompt",
}

type StepsFormProps = {
  workflowName: string
  launchUrl: string
}

const StepsForm = (_props: StepsFormProps) => {
  return (
    <ComboBox
      options={Object.keys(Action).map((key) => ({
        value: key.toLowerCase(),
        label: key.slice(0, 1) + key.slice(1).toLowerCase(),
      }))}
    />
  )
}
StepsForm.displayName = "StepsForm"

export default StepsForm
