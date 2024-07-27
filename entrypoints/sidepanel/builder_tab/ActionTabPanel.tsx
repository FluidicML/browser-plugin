import React from "react"

import { ComboBox } from "@/components/ui/combobox"

import { type ActionForm, ActionKind } from "@/utils/workflow"
import ActionCaptureForm from "./ActionCaptureForm"
import ActionNavigateForm from "./ActionNavigateForm"
import ActionPromptForm from "./ActionPromptForm"

export type ActionTab = {
  key: string
  label: string
  form?: ActionForm
}

type ActionTabPanelProps = {
  onValidInput: (values: ActionForm) => void
}

const ActionTabPanel = ({ onValidInput }: ActionTabPanelProps) => {
  const [actionKindActive, setActionKindActive] = React.useState<ActionKind>(
    ActionKind.CAPTURE
  )

  const actionTabForm = React.useMemo(() => {
    switch (actionKindActive) {
      case ActionKind.CAPTURE: {
        return <ActionCaptureForm onValidInput={onValidInput} />
      }
      case ActionKind.NAVIGATE: {
        return <ActionNavigateForm onValidInput={onValidInput} />
      }
      case ActionKind.PROMPT: {
        return <ActionPromptForm onValidInput={onValidInput} />
      }
      default: {
        const _exhaustivenessCheck: never = actionKindActive
        break
      }
    }
  }, [actionKindActive])

  return (
    <div>
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
