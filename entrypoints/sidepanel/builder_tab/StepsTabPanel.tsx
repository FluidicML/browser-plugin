import React from "react"

import { ComboBox } from "@/components/ui/combobox"

import ActionCaptureForm from "./ActionCaptureForm"
import ActionNavigateForm from "./ActionNavigateForm"
import ActionPromptForm from "./ActionPromptForm"

enum Action {
  CAPTURE = "capture",
  NAVIGATE = "navigate",
  PROMPT = "prompt",
}

type StepsTabPanelProps = {
  onSubmit: (values: Record<string, any>) => void
}

const StepsTabPanel = ({ onSubmit }: StepsTabPanelProps) => {
  const [selectedAction, setSelectedAction] = React.useState<Action>(
    Action.CAPTURE
  )

  const actionTabForm = React.useMemo(() => {
    switch (selectedAction) {
      case Action.CAPTURE: {
        return <ActionCaptureForm onSubmit={onSubmit} />
      }
      case Action.NAVIGATE: {
        return <ActionNavigateForm onSubmit={onSubmit} />
      }
      case Action.PROMPT: {
        return <ActionPromptForm onSubmit={onSubmit} />
      }
      default: {
        const _exhaustivenessCheck: never = selectedAction
        break
      }
    }
  }, [selectedAction])

  return (
    <div className="p-4">
      <ComboBox
        options={Object.keys(Action).map((key) => ({
          value: key.toLowerCase(),
          label: key.slice(0, 1) + key.slice(1).toLowerCase(),
        }))}
        onSelect={(value) => setSelectedAction(value as Action)}
      />
      <hr className="bg-muted w-1/2 h-1 my-6 mx-auto" />
      {actionTabForm}
    </div>
  )
}
StepsTabPanel.displayName = "StepsTabPanel"

export default StepsTabPanel
