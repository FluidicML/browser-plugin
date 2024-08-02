import React from "react"

import { ComboBox } from "@/components/ui/combobox"

import { type ActionForm, ActionKind } from "@/utils/workflow"
import ActionExtractingForm from "./ActionExtractingForm"
import ActionRecordingForm from "./ActionRecordingForm"
import ActionNavigateForm from "./ActionNavigateForm"
import ActionPromptForm from "./ActionPromptForm"

type ActionTabPanelProps = {
  params: Set<string>
  onChange: (values: ActionForm | null) => void
}

const ActionTabPanel = ({ params, onChange }: ActionTabPanelProps) => {
  const [actionKindActive, setActionKindActive] = React.useState<ActionKind>(
    ActionKind.RECORDING
  )

  const actionTabForm = React.useMemo(() => {
    switch (actionKindActive) {
      case ActionKind.EXTRACTING: {
        return <ActionExtractingForm onChange={onChange} />
      }
      case ActionKind.RECORDING: {
        return <ActionRecordingForm onChange={onChange} />
      }
      case ActionKind.NAVIGATE: {
        return <ActionNavigateForm onChange={onChange} />
      }
      case ActionKind.PROMPT: {
        return <ActionPromptForm onChange={onChange} />
      }
      default: {
        const _exhaustivenessCheck: never = actionKindActive
        break
      }
    }
  }, [onChange, actionKindActive])

  return (
    <div>
      <ComboBox
        value={actionKindActive}
        options={Object.keys(ActionKind).map((key) => ({
          value: key.toLowerCase(),
          label: key.slice(0, 1) + key.slice(1).toLowerCase(),
        }))}
        onSelect={(value) => {
          const kind = value as ActionKind
          if (kind !== actionKindActive) {
            onChange(null)
          }
          setActionKindActive(kind)
        }}
      />
      {params.size > 0
        ? [...params].map((p) => <span key={p}>{p}</span>)
        : null}
      <hr className="bg-muted w-1/2 h-1 my-6 mx-auto" />
      {actionTabForm}
    </div>
  )
}
ActionTabPanel.displayName = "ActionTabPanel"

export default ActionTabPanel
