import React from "react"

import { ComboBox } from "@/components/ui/combobox"

import ActionCaptureForm from "./ActionCaptureForm"
import ActionNavigateForm from "./ActionNavigateForm"
import ActionPromptForm from "./ActionPromptForm"
import { type ActionTab, ActionKind } from "./schema"

type ActionTabPanelProps = {
  onSubmit: (values: ActionTab["values"]) => void
}

const ActionTabPanel = ({ onSubmit }: ActionTabPanelProps) => {
  const [actionKindActive, setActionKindActive] = React.useState<ActionKind>(
    ActionKind.CAPTURE
  )

  const actionTabForm = React.useMemo(() => {
    switch (actionKindActive) {
      case ActionKind.CAPTURE: {
        return <ActionCaptureForm onSubmit={onSubmit} />
      }
      case ActionKind.NAVIGATE: {
        return <ActionNavigateForm onSubmit={onSubmit} />
      }
      case ActionKind.PROMPT: {
        return <ActionPromptForm onSubmit={onSubmit} />
      }
      default: {
        const _exhaustivenessCheck: never = actionKindActive
        break
      }
    }
  }, [actionKindActive])

  return (
    <div className="p-4">
      <ComboBox
        value={actionKindActive}
        options={Object.keys(ActionKind).map((key) => ({
          value: key.toLowerCase(),
          label: key.slice(0, 1) + key.slice(1).toLowerCase(),
        }))}
        onSelect={(value) => setActionKindActive(value as ActionKind)}
      />
      <hr className="bg-muted w-1/2 h-1 my-6 mx-auto" />
      {actionTabForm}
    </div>
  )
}
ActionTabPanel.displayName = "ActionTabPanel"

export default ActionTabPanel
