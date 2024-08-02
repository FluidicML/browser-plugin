import React from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ComboBox } from "@/components/ui/combobox"
import { Separator } from "@/components/ui/separator"
import { type ActionForm, ActionKind } from "@/utils/workflow"
import BracesIcon from "@/components/icons/Braces"
import ActionExtractingForm from "./ActionExtractingForm"
import ActionRecordingForm from "./ActionRecordingForm"
import ActionNavigateForm from "./ActionNavigateForm"
import ActionPromptForm from "./ActionPromptForm"

type ParameterSheetProps = {
  params: Set<string>
}

const ParameterSheet = ({ params }: ParameterSheetProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <BracesIcon className="w-6 h-6 fill-black dark:fill-white" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Parameters</SheetTitle>
          <SheetDescription>
            Include any of the following parameters into your prompt. We will
            substitute them on running.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-wrap gap-8 pt-8">
          {[...params].map((p) => (
            <pre key={p}>{`{${p}}`}</pre>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

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
      <div className="flex gap-2">
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
        {params.size > 0 &&
        [ActionKind.NAVIGATE, ActionKind.PROMPT].includes(actionKindActive) ? (
          <ParameterSheet params={params} />
        ) : null}
      </div>

      <Separator className="my-4" />

      {actionTabForm}
    </div>
  )
}
ActionTabPanel.displayName = "ActionTabPanel"

export default ActionTabPanel
