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

type CaptureContentProps = {
  name: string
  body: string
}

const CaptureContent = ({ name, body }: CaptureContentProps) => {
  return (
    <CardContent>
      <div>
        Element with {name}: <pre className="pt-2 text-center">{body}</pre>
      </div>
    </CardContent>
  )
}

type CaptureEntryProps = {
  index: number
  action: "click"
  locator: Locator
}

const CaptureCard = ({ index, action, locator }: CaptureEntryProps) => {
  const step = `Step ${index + 1}`
  const name = action.slice(0, 1).toUpperCase() + action.slice(1)

  const content: CaptureContentProps = React.useMemo(() => {
    if (locator.title) {
      return { name: "title", body: locator.title }
    }
    if (locator.altText) {
      return { name: "alt", body: locator.altText }
    }
    if (locator.label) {
      return { name: "label", body: locator.label }
    }
    if (locator.text) {
      let prefix = locator.text.slice(0, 60)
      if (prefix.length < locator.text.length) {
        prefix += "..."
      }
      return { name: "text", body: prefix }
    }
    if (locator.placeholder) {
      return { name: "placeholder", body: locator.placeholder }
    }
    if (locator.testId) {
      return { name: "test id", body: locator.testId }
    }
    return { name: "CSS", body: locator.css }
  }, [locator])

  return (
    <Card>
      <CardTitle className="pb-4">{`${step} - ${name}`}</CardTitle>
      <CaptureContent {...content} />
    </Card>
  )
}

type ActionCaptureFormProps = {
  onChange: (values: ActionForm | null) => void
}

const ActionCaptureForm = ({ onChange }: ActionCaptureFormProps) => {
  const store = useSharedStore()

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
      store.actions.setIsCapturing(false)
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
      <form className="space-y-4">
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
        <div className="flex flex-col gap-4 pt-2">
          {...captures.fields.map((capture, i) => (
            <CaptureCard key={i} index={i} {...capture} />
          ))}
        </div>
      </form>
    </Form>
  )
}
ActionCaptureForm.displayName = "ActionCaptureForm"

export default ActionCaptureForm
