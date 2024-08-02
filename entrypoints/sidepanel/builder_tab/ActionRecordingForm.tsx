import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"

import type { ActionRecordingSchema, ActionForm } from "@/utils/workflow"
import { ActionKind, actionRecordingSchema } from "@/utils/workflow"
import {
  MessageEvent,
  addMessageListener,
  removeMessageListener,
  broadcastTabs,
} from "@/utils/messages"
import PlayIcon from "@/components/icons/Play"
import StopIcon from "@/components/icons/Stop"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { useSharedStore } from "../store"
import LocatorTable from "./LocatorTable"

type ActionCardProps = {
  index: number
  recording: ActionClickSchema | ActionKeyupSchema
}

const ActionCard = ({ index, recording }: ActionCardProps) => {
  const action = recording.action
  const title = `Step ${index + 1} - ${action.slice(0, 1).toUpperCase() + action.slice(1)}`

  const Subtitle = () => {
    switch (action) {
      case "click": {
        return <span>Clicked on element:</span>
      }
      case "keyup": {
        let prefix = recording.value.slice(0, 40)
        if (prefix.length < recording.value.length) {
          prefix += "..."
        }
        return (
          <span>
            Input <span className="font-bold">{prefix}</span> into element:
          </span>
        )
      }
      default: {
        const _exhaustivenessCheck: never = action
        return null
      }
    }
  }

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <CardDescription className="pb-2">{Subtitle()}</CardDescription>
      <hr />
      <CardContent className="pt-4 pb-2 overflow-x-auto scrollbar">
        {typeof recording.selector === "string" ? (
          <pre>{recording.selector}</pre>
        ) : (
          <LocatorTable locator={recording.selector} />
        )}
      </CardContent>
    </Card>
  )
}

type ActionRecordingFormProps = {
  onChange: (values: ActionForm | null) => void
}

const ActionRecordingForm = ({ onChange }: ActionRecordingFormProps) => {
  const id = React.useId()
  const store = useSharedStore()
  const [isRecording, setIsRecording] = React.useState(false)

  const form = useForm<ActionRecordingSchema>({
    resolver: zodResolver(actionRecordingSchema),
    defaultValues: {},
  })

  const recordings = useFieldArray({
    control: form.control,
    name: "recordings",
  })

  React.useEffect(() => {
    return () => {
      broadcastTabs({ event: MessageEvent.RECORDING_STOP, payload: null })
      store.actions.unlock(id)
    }
  }, [store.actions])

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = actionRecordingSchema.safeParse(values)
      onChange(
        parsed.success
          ? { kind: ActionKind.RECORDING, values: parsed.data }
          : null
      )
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  React.useEffect(() => {
    if (!isRecording) {
      return
    }
    const listener = addMessageListener((message) => {
      switch (message.event) {
        case MessageEvent.RECORDING_QUERY: {
          return Promise.resolve(true)
        }
        case MessageEvent.RECORDING_CLICK: {
          if (message.payload === null) {
            return
          }
          recordings.append(message.payload)
          break
        }
        case MessageEvent.RECORDING_KEYUP: {
          if (message.payload === null) {
            return
          }
          const last = recordings.fields[recordings.fields.length - 1]
          if (message.payload.replace && last.action === "keyup") {
            recordings.update(recordings.fields.length - 1, message.payload)
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
      <form className="space-y-4">
        <p>
          Click "Start" and then interact with the browser like you normally do.
          We track each click, type, etc. automatically.
        </p>
        <Button
          type="button"
          className="w-full flex gap-2"
          onClick={() => {
            if (isRecording) {
              broadcastTabs({
                event: MessageEvent.RECORDING_STOP,
                payload: null,
              }).then(() => {
                store.actions.unlock(id)
                setIsRecording(false)
              })
            } else {
              broadcastTabs({
                event: MessageEvent.RECORDING_START,
                payload: null,
              }).then(() => {
                setIsRecording(true)
                store.actions.lock(id)
              })
            }
          }}
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
            <ActionCard index={index} recording={recording} />
          ))}
        </div>
      </form>
    </Form>
  )
}
ActionRecordingForm.displayName = "ActionRecordingForm"

export default ActionRecordingForm
