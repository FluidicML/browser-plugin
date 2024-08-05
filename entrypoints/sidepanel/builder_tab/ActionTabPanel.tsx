import React from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { TabsContent } from "@/components/ui/tabs"
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

type ActionTabPanelProps = Omit<
  React.ComponentPropsWithoutRef<typeof TabsContent>,
  "onChange"
> & {
  defaultValues: ActionForm | null
  params: Set<string>
  onChange: (values: ActionForm | null) => void
  onRemove: () => void
}

const ActionTabPanel = React.forwardRef<
  React.ElementRef<typeof TabsContent>,
  ActionTabPanelProps
>(({ defaultValues, params, onChange, onRemove, ...props }, ref) => {
  const [activeKind, setActiveKind] = React.useState<ActionKind>(
    defaultValues?.kind ?? ActionKind.NAVIGATE
  )

  const scrollRef = React.useRef<HTMLElement | null>(null)
  const triggerScroll = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight)
    }
  }

  const actionTabForm = React.useMemo(() => {
    switch (activeKind) {
      case ActionKind.EXTRACTING: {
        return (
          <ActionExtractingForm
            defaultValues={
              defaultValues?.kind === ActionKind.EXTRACTING
                ? defaultValues.values
                : null
            }
            onChange={onChange}
          />
        )
      }
      case ActionKind.RECORDING: {
        return (
          <ActionRecordingForm
            defaultValues={
              defaultValues?.kind === ActionKind.RECORDING
                ? defaultValues.values
                : null
            }
            onChange={onChange}
            triggerScroll={triggerScroll}
          />
        )
      }
      case ActionKind.NAVIGATE: {
        return (
          <ActionNavigateForm
            defaultValues={
              defaultValues?.kind === ActionKind.NAVIGATE
                ? defaultValues.values
                : null
            }
            onChange={onChange}
          />
        )
      }
      case ActionKind.OPENAI: {
        return (
          <ActionOpenAIForm
            defaultValues={
              defaultValues?.kind === ActionKind.OPENAI
                ? defaultValues.values
                : null
            }
            onChange={onChange}
          />
        )
      }
      default: {
        const _exhaustivenessCheck: never = activeKind
        break
      }
    }
  }, [onChange, activeKind])

  return (
    <TabsContent
      ref={(node) => {
        scrollRef.current = node
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      }}
      {...props}
    >
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
    </TabsContent>
  )
})
ActionTabPanel.displayName = "ActionTabPanel"

export default ActionTabPanel
