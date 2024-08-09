import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Control, useFieldArray, useForm } from "react-hook-form"

import {
  type StepRecordingSchema,
  type Step,
  StepKind,
  stepRecordingSchema,
} from "@/utils/schema"
import {
  Event,
  addMessageListener,
  removeMessageListener,
  sendTab,
} from "@/utils/messages"
import CollapseIcon from "@/components/icons/Collapse"
import ExpandIcon from "@/components/icons/Expand"
import PlayIcon from "@/components/icons/Play"
import StopIcon from "@/components/icons/Stop"
import TrashIcon from "@/components/icons/Trash"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useSharedStore } from "../store"
import SelectorTable from "./SelectorTable"

type ActionCardProps = {
  control: Control<StepRecordingSchema>
  index: number
  recording: StepRecordingSchema["recordings"][number]
  onRemove: () => void
}

const ActionCard = ({
  control,
  index,
  recording,
  onRemove,
}: ActionCardProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const action = recording.action
  const title = `Step ${index + 1} - ${action.slice(0, 1).toUpperCase() + action.slice(1)}`

  const Subtitle = () => {
    switch (action) {
      case "click": {
        return null
      }
      case "keyup": {
        let prefix = recording.value.slice(0, 24)
        return prefix.length < recording.value.length ? `${prefix}...` : prefix
      }
      default: {
        const _exhaustivenessCheck: never = action
        return null
      }
    }
  }

  return (
    <Card>
      <CardTitle>
        {title}
        <Button
          type="button"
          size="xicon"
          className="float-right group hover:bg-destructive/90"
          onClick={onRemove}
        >
          <TrashIcon className="w-5 h-5 stroke-white dark:stroke-black group-hover:stroke-white" />
        </Button>
      </CardTitle>
      <CardDescription>{Subtitle()}</CardDescription>
      <CardContent className="pt-2">
        <SelectorTable selector={recording.selector} />
        <Separator className="my-3" />
        <Collapsible>
          <CollapsibleTrigger
            className="w-full"
            onClick={() => setIsExpanded((e) => !e)}
          >
            <div className="flex items-center">
              More Options
              <Button className="ml-auto" size="xicon" variant="ghost">
                {isExpanded ? (
                  <CollapseIcon className="w-5 h-5 fill-black dark:fill-white" />
                ) : (
                  <ExpandIcon className="w-5 h-5 fill-black dark:fill-white" />
                )}
              </Button>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-1">
            <FormField
              control={control}
              name={`recordings.${index}.fallible`}
              render={({ field }) => (
                <FormItem className="flex gap-2 items-start">
                  <FormControl className="mt-3">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="text-sm">
                      This step can fail.
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Certain actions aren't reproducible on every version of a
                      webpage. Setting this lets the workflow continue even when
                      the action fails.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

type StepRecordingFormProps = {
  defaultValues: StepRecordingSchema | null
  onChange: (values: Step | null) => void
  triggerScroll: () => void
}

const StepRecordingForm = ({
  defaultValues,
  onChange,
  triggerScroll,
}: StepRecordingFormProps) => {
  const id = React.useId()
  const store = useSharedStore()
  const [isRecording, setIsRecording] = React.useState(false)

  const toggleRecording = React.useCallback(async () => {
    try {
      if (isRecording) {
        await sendTab(null, {
          event: Event.RECORDING_STOP,
          payload: null,
        })
      } else {
        await sendTab(null, {
          event: Event.RECORDING_START,
          payload: null,
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      if (isRecording) {
        store.sharedActions.unlock(id)
        setIsRecording(false)
      } else {
        setIsRecording(true)
        store.sharedActions.lock(id)
      }
    }
  }, [isRecording, setIsRecording, store.sharedActions])

  const form = useForm<StepRecordingSchema>({
    resolver: zodResolver(stepRecordingSchema),
    defaultValues: defaultValues ?? {},
  })

  const recordings = useFieldArray({
    control: form.control,
    name: "recordings",
  })

  // Maintain a separate count so that we can distinguish between insertions
  // and deletions. Insertions should scroll downward. Deletions should not.
  const recordingsCount = React.useRef(defaultValues?.recordings.length ?? 0)

  React.useEffect(() => {
    return () => {
      sendTab(null, { event: Event.RECORDING_STOP, payload: null })
      store.sharedActions.unlock(id)
    }
  }, [store.sharedActions])

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.recordings) {
        if (values.recordings.length > recordingsCount.current) {
          triggerScroll()
        }
        recordingsCount.current = values.recordings.length
      }
      const parsed = stepRecordingSchema.safeParse(values)
      onChange(
        parsed.success
          ? { kind: StepKind.RECORDING, values: parsed.data }
          : null
      )
    })
    return () => subscription.unsubscribe()
  }, [triggerScroll, form.watch])

  React.useEffect(() => {
    if (!isRecording) {
      return
    }
    const listener = addMessageListener((message) => {
      switch (message.event) {
        case Event.RECORDING_QUERY: {
          return Promise.resolve(true)
        }
        case Event.RECORDING_CLICK: {
          if (message.payload === null) {
            return
          }
          recordings.append(message.payload)
          break
        }
        case Event.RECORDING_KEYUP: {
          if (message.payload === null) {
            return
          }
          const index = recordings.fields.length - 1
          const last = recordings.fields[index]
          const value = form.watch(`recordings.${index}.value`)
          if (message.payload.append && last.action === "keyup") {
            recordings.update(recordings.fields.length - 1, {
              ...message.payload,
              value: value + message.payload.value,
            })
          } else {
            recordings.append(message.payload)
          }
          break
        }
      }
    })
    return () => removeMessageListener(listener)
  }, [isRecording, recordings])

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <p>
          Click "Start" and then interact with the browser like you normally do.
          We track each click, type, etc. automatically.
        </p>
        <Button
          type="button"
          className="w-full flex gap-2"
          onClick={toggleRecording}
        >
          {isRecording ? (
            <>
              <StopIcon className="w-6 h-6" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <PlayIcon className="w-6 h-6" />
              <span>Start</span>
            </>
          )}
        </Button>
        <div className="flex flex-col gap-4 pt-2">
          {...recordings.fields.map((recording, index) => (
            <ActionCard
              key={recording.id}
              control={form.control}
              index={index}
              recording={recording}
              onRemove={() => recordings.remove(index)}
            />
          ))}
        </div>
      </form>
    </Form>
  )
}
StepRecordingForm.displayName = "StepRecordingForm"

export default StepRecordingForm
