import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Control, useFieldArray, useForm } from "react-hook-form"

import { getActiveTab } from "@/utils/browser_tabs"
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
import { Input } from "@/components/ui/input"
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
  const sharedStore = useSharedStore()
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
    <Card className="space-y-4">
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
      <CardContent>
        <SelectorTable selector={recording.selector} />
        <Separator className="my-3" />
        <Collapsible>
          <CollapsibleTrigger
            className="w-full"
            onClick={() => setIsExpanded((e) => !e)}
          >
            <div className="flex items-center">
              More Options
              <div className="ml-auto">
                {isExpanded ? (
                  <CollapseIcon className="w-5 h-5 fill-black dark:fill-white" />
                ) : (
                  <ExpandIcon className="w-5 h-5 fill-black dark:fill-white" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-3">
            <FormField
              control={control}
              name={`recordings.${index}.fallible`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">This step can fail.</FormLabel>
                  <div className="flex gap-2 items-start">
                    <FormControl>
                      <Checkbox
                        className="mt-1"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Lets the automation script continue even if the action
                      fails.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`recordings.${index}.confirmed`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">
                    This step requires confirmation.
                  </FormLabel>
                  <div className="flex gap-2 items-start">
                    <FormControl>
                      <Checkbox
                        className="mt-1"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Prompts the user for confirmation before continuing to the
                      next action.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`recordings.${index}.replayTimeoutSecs`}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div>
                    <FormLabel className="text-xs">Timeout (Sec.)</FormLabel>
                    <FormDescription className="text-xs">
                      Override how long this step can take before timing out.
                    </FormDescription>
                  </div>
                  <FormControl className="mt-2">
                    <Input
                      type="number"
                      placeholder={`${sharedStore.settingsReplayTimeoutSecs}`}
                      {...field}
                    />
                  </FormControl>
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
}

const StepRecordingForm = ({
  defaultValues,
  onChange,
}: StepRecordingFormProps) => {
  const id = React.useId()
  const store = useSharedStore()
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const [isRecording, setIsRecording] = React.useState(false)

  const toggleRecording = React.useCallback(async () => {
    try {
      const tab = await getActiveTab()
      if (!tab?.id) {
        console.warn("Attempting to trigger for unsupported tab.")
        return
      }
      if (isRecording) {
        await sendTab(tab.id, {
          event: Event.RECORDING_STOP,
          payload: null,
        })
      } else {
        await sendTab(tab.id, {
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

  // Notify on form changes. Status is propagated upward so we can decide
  // whether or not the user is allowed to save the script.
  React.useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.recordings) {
        if (
          values.recordings.length > recordingsCount.current &&
          scrollRef.current
        ) {
          scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight)
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
  }, [form.watch])

  // Process messages while this form is active. Necessary for tracking which
  // elements the user is recording against as well as synchronizing state
  // across tabs (e.g. on change).
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
          const replayTimeoutSecs = form.watch(
            `recordings.${index}.replayTimeoutSecs`
          )
          if (message.payload.append && last.action === "keyup") {
            recordings.update(recordings.fields.length - 1, {
              ...message.payload,
              value: value + message.payload.value,
              replayTimeoutSecs: replayTimeoutSecs,
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

  // Cleanup on dismount. Ensure that if we are actively recording, we notify
  // any tabs that we are done.
  React.useEffect(() => {
    return () => {
      if (!isRecording) {
        return
      }
      getActiveTab().then((tab) => {
        if (tab?.id) {
          sendTab(tab.id, { event: Event.RECORDING_STOP, payload: null })
          store.sharedActions.unlock(id)
        }
      })
    }
  }, [])

  return (
    <Form {...form}>
      <form
        className="grow flex flex-col overflow-y-auto space-y-4"
        onSubmit={(e) => e.preventDefault()}
      >
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
        <div
          ref={scrollRef}
          className="grow flex flex-col gap-4 pt-2 overflow-y-auto scrollbar"
        >
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
