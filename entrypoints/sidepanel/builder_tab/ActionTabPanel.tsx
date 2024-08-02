import React from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ComboBox } from "@/components/ui/combobox"
import { Separator } from "@/components/ui/separator"
import { type ActionForm, ActionKind } from "@/utils/schema"
import BracesIcon from "@/components/icons/Braces"
import TrashIcon from "@/components/icons/Trash"
import ActionExtractingForm from "./ActionExtractingForm"
import ActionRecordingForm from "./ActionRecordingForm"
import ActionNavigateForm from "./ActionNavigateForm"
import ActionOpenAIForm from "./ActionOpenAIForm"

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
            Include any of the following parameters into form inputs. We will
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
  onRemove: () => void
}

const ActionTabPanel = ({
  params,
  onChange,
  onRemove,
}: ActionTabPanelProps) => {
  const [activeKind, setActiveKind] = React.useState<ActionKind>(
    ActionKind.NAVIGATE
  )

  const actionTabForm = React.useMemo(() => {
    switch (activeKind) {
      case ActionKind.EXTRACTING: {
        return <ActionExtractingForm onChange={onChange} />
      }
      case ActionKind.RECORDING: {
        return <ActionRecordingForm onChange={onChange} />
      }
      case ActionKind.NAVIGATE: {
        return <ActionNavigateForm onChange={onChange} />
      }
      case ActionKind.OPENAI: {
        return <ActionOpenAIForm onChange={onChange} />
      }
      default: {
        const _exhaustivenessCheck: never = activeKind
        break
      }
    }
  }, [onChange, activeKind])

  return (
    <div>
      <div className="flex gap-2">
        {params.size > 0 &&
        [ActionKind.NAVIGATE, ActionKind.OPENAI].includes(activeKind) ? (
          <ParameterSheet params={params} />
        ) : null}
        <ComboBox
          value={activeKind}
          options={Object.values(ActionKind).map((value) => ({
            label: value,
            value,
          }))}
          onSelect={(value) => setActiveKind(value as ActionKind)}
        />
        <Button
          size="icon"
          className="group hover:bg-destructive/90"
          onClick={onRemove}
        >
          <TrashIcon className="w-5 h-5 stroke-white dark:stroke-black group-hover:stroke-white" />
        </Button>
      </div>
      <Separator className="my-4" />
      {actionTabForm}
    </div>
  )
}
ActionTabPanel.displayName = "ActionTabPanel"

export default ActionTabPanel
