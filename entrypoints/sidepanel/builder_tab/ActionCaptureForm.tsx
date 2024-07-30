import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

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

type ActionCaptureFormProps = {
  onValidInput: (values: ActionForm) => void
}

const ActionCaptureForm = ({ onValidInput }: ActionCaptureFormProps) => {
  // TODO: Stick to using the store capturing state.
  const [isCapturing, setIsCapturing] = React.useState(false)
  const [captureList, setCaptureList] = React.useState<Locator[]>([])

  const form = useForm<ActionCaptureSchema>({
    resolver: zodResolver(actionCaptureSchema),
    defaultValues: {},
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
    const listener = addMessageListener(async (message) => {
      const payload = message.payload
      if (message.event === MessageEvent.CAPTURE_CLICK && payload !== null) {
        setCaptureList((cs) => [...cs, payload])
      }
      if (message.event === MessageEvent.CAPTURE_QUERY) {
        return true
      }
    })
    return () => removeMessageListener(listener)
  }, [isCapturing, setCaptureList])

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
              event: isCapturing
                ? MessageEvent.CAPTURE_STOP
                : MessageEvent.CAPTURE_START,
              payload: null,
            })
            setIsCapturing((c) => !c)
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
        <div className="flex flex-col">
          {...captureList.map((capture) => (
            <span>{serializeLocator(capture)}</span>
          ))}
        </div>
      </form>
    </Form>
  )
}
ActionCaptureForm.displayName = "ActionCaptureForm"

export default ActionCaptureForm
