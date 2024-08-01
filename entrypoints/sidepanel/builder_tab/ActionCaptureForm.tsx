import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"

import type { ActionCaptureSchema, ActionForm } from "@/utils/workflow"
import { ActionKind, actionCaptureSchema } from "@/utils/workflow"
import {
  MessageEvent,
  addMessageListener,
  broadcastTabs,
} from "@/utils/messages"
import PlayIcon from "@/components/icons/Play"
import StopIcon from "@/components/icons/Stop"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { useSharedStore } from "../store"

type ClickCardContentProps = {}

const ClickCardContent = ({}: ClickCardContentProps) => {
  return (
    <CardContent>
      <div>Clicked element.</div>
    </CardContent>
  )
}

type KeyupCardContentProps = {
  value: string
}

const KeyupCardContent = ({ value }: KeyupCardContentProps) => {
  return (
    <CardContent>
      <div>
        Input <pre className="pt-2 text-center">{value}</pre>
      </div>
    </CardContent>
  )
}

type ActionCaptureFormProps = {
  onChange: (values: ActionForm | null) => void
}

const ActionCaptureForm = ({ onChange }: ActionCaptureFormProps) => {
  const id = React.useId()
  const store = useSharedStore()
  const [isCapturing, setIsCapturing] = React.useState(false)

  const form = useForm<ActionCaptureSchema>({
    resolver: zodResolver(actionCaptureSchema),
    defaultValues: {},
  })

  const captures = useFieldArray({
    control: form.control,
    name: "captures",
  })

  React.useEffect(() => {
    return () => {
      broadcastTabs({ event: MessageEvent.CAPTURE_STOP, payload: null })
      store.actions.unlock(id)
    }
  }, [store.actions])

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = actionCaptureSchema.safeParse(values)
      onChange(
        parsed.success
          ? { kind: ActionKind.CAPTURE, values: parsed.data }
          : null
      )
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  React.useEffect(() => {
    if (!isCapturing) {
      return
    }
    const listener = addMessageListener((message) => {
      switch (message.event) {
        case MessageEvent.CAPTURE_CLICK: {
          if (message.payload === null) {
            return
          }
          captures.append(message.payload)
          break
        }
        case MessageEvent.CAPTURE_KEYUP: {
          if (message.payload === null) {
            return
          }
          const last = captures.fields[captures.fields.length - 1]
          if (message.payload.replace && last.action === "keyup") {
            captures.update(captures.fields.length - 1, message.payload)
          } else {
            captures.append(message.payload)
          }
          break
        }
      }
    })
    return () => removeMessageListener(listener)
  }, [isCapturing, captures])

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
            if (isCapturing) {
              broadcastTabs({
                event: MessageEvent.CAPTURE_STOP,
                payload: null,
              }).then(() => {
                store.actions.unlock(id)
                setIsCapturing(false)
              })
            } else {
              broadcastTabs({
                event: MessageEvent.CAPTURE_START,
                payload: null,
              }).then(() => {
                setIsCapturing(true)
                store.actions.lock(id)
              })
            }
          }}
        >
          {isCapturing ? (
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
          {...captures.fields.map((capture, index) => {
            const action = capture.action
            const step = `Step ${index + 1}`
            const name = action.slice(0, 1).toUpperCase() + action.slice(1)

            return (
              <Card>
                <CardTitle className="pb-4">{`${step} - ${name}`}</CardTitle>
                {action === "click" ? (
                  <ClickCardContent />
                ) : action === "keyup" ? (
                  <KeyupCardContent value={capture.value} />
                ) : null}
              </Card>
            )
          })}
        </div>
      </form>
    </Form>
  )
}
ActionCaptureForm.displayName = "ActionCaptureForm"

export default ActionCaptureForm
