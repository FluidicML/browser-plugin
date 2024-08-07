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
import { type Step, StepKind } from "@/utils/schema"
import BracesIcon from "@/components/icons/Braces"
import TrashIcon from "@/components/icons/Trash"
import StepExtractingForm from "./StepExtractingForm"
import StepInjectingForm from "./StepInjectingForm"
import StepNavigateForm from "./StepNavigateForm"
import StepOpenAIForm from "./StepOpenAIForm"
import StepPromptForm from "./StepPromptForm"
import StepRecordingForm from "./StepRecordingForm"

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

type StepTabPanelProps = Omit<
  React.ComponentPropsWithoutRef<typeof TabsContent>,
  "onChange"
> & {
  defaultValues: Step | null
  params: Set<string>
  onChange: (values: Step | null) => void
  onRemove: () => void
}

const StepTabPanel = React.forwardRef<
  React.ElementRef<typeof TabsContent>,
  StepTabPanelProps
>(({ defaultValues, params, onChange, onRemove, ...props }, ref) => {
  const [activeKind, setActiveKind] = React.useState<StepKind>(
    defaultValues?.kind ?? StepKind.NAVIGATE
  )

  const scrollRef = React.useRef<HTMLElement | null>(null)
  const triggerScroll = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight)
    }
  }

  const stepTabForm = React.useMemo(() => {
    switch (activeKind) {
      case StepKind.EXTRACTING: {
        return (
          <StepExtractingForm
            defaultValues={
              defaultValues?.kind === StepKind.EXTRACTING
                ? defaultValues.values
                : null
            }
            onChange={onChange}
          />
        )
      }
      case StepKind.INJECTING: {
        return (
          <StepInjectingForm
            defaultValues={
              defaultValues?.kind === StepKind.INJECTING
                ? defaultValues.values
                : null
            }
            onChange={onChange}
            params={params}
          />
        )
      }
      case StepKind.NAVIGATE: {
        return (
          <StepNavigateForm
            defaultValues={
              defaultValues?.kind === StepKind.NAVIGATE
                ? defaultValues.values
                : null
            }
            onChange={onChange}
          />
        )
      }
      case StepKind.OPENAI: {
        return (
          <StepOpenAIForm
            defaultValues={
              defaultValues?.kind === StepKind.OPENAI
                ? defaultValues.values
                : null
            }
            onChange={onChange}
          />
        )
      }
      case StepKind.PROMPT: {
        return (
          <StepPromptForm
            defaultValues={
              defaultValues?.kind === StepKind.PROMPT
                ? defaultValues.values
                : null
            }
            onChange={onChange}
          />
        )
      }
      case StepKind.RECORDING: {
        return (
          <StepRecordingForm
            defaultValues={
              defaultValues?.kind === StepKind.RECORDING
                ? defaultValues.values
                : null
            }
            onChange={onChange}
            triggerScroll={triggerScroll}
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
        [StepKind.INJECTING, StepKind.NAVIGATE, StepKind.OPENAI].includes(
          activeKind
        ) ? (
          <ParameterSheet params={params} />
        ) : null}
        <ComboBox
          value={activeKind}
          options={Object.values(StepKind).map((value) => ({
            label: value,
            value,
          }))}
          onSelect={(value) => setActiveKind(value as StepKind)}
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
      {stepTabForm}
    </TabsContent>
  )
})
StepTabPanel.displayName = "StepTabPanel"

export default StepTabPanel
