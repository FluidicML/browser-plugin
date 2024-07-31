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
import { serializeLocator } from "@/utils/locator"
import PlayIcon from "@/components/icons/Play"
import StopIcon from "@/components/icons/Stop"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { useSharedStore } from "../store"

type ActionCaptureFormProps = {
  onValidInput: (values: ActionForm) => void
}

const ActionCaptureForm = ({ onValidInput }: ActionCaptureFormProps) => {
  const store = useSharedStore()

  const form = useForm<ActionCaptureSchema>({
    resolver: zodResolver(actionCaptureSchema),
    defaultValues: {},
  })

  const captures = useFieldArray({
    control: form.control,
    name: "locators",
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = actionCaptureSchema.safeParse(values)
      if (parsed.success) {
        onValidInput({ kind: ActionKind.CAPTURE, values: parsed.data })
      }
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  React.useEffect(() => {
    const listener = addMessageListener((message) => {
      switch (message.event) {
        case MessageEvent.CAPTURE_CLICK: {
          const payload = message.payload
          if (payload !== null) {
            captures.append(payload)
          }
        }
      }
    })
    return () => removeMessageListener(listener)
  }, [captures.append])

  return (
    <Form {...form}>
      <form className="space-y-8">
        <p>
          Click "Start" and then interact with the browser like you normally do.
          We track each click, type, etc. automatically.
        </p>
        <Button
          type="button"
          className="w-full flex gap-2"
          onClick={() => {
            broadcastTabs({
              event: store.isCapturing
                ? MessageEvent.CAPTURE_STOP
                : MessageEvent.CAPTURE_START,
              payload: null,
            })
            store.actions.setIsCapturing((c) => !c)
          }}
        >
          {store.isCapturing ? (
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
        <div className="flex flex-col">
          {...captures.fields.map((capture) => (
            <span>{serializeLocator(capture)}</span>
          ))}
        </div>
      </form>
    </Form>
  )
}
ActionCaptureForm.displayName = "ActionCaptureForm"

export default ActionCaptureForm
