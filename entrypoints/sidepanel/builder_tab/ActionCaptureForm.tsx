import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import type { ActionCaptureSchema, ActionTab } from "./schema"
import { ActionKind, actionCaptureSchema } from "./schema"
import PlayIcon from "@/components/icons/Play"
import StopIcon from "@/components/icons/Stop"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"

type ActionCaptureFormProps = {
  onValidInput: (values: ActionTab["form"]) => void
}

const ActionCaptureForm = ({ onValidInput }: ActionCaptureFormProps) => {
  const [isCapturing, setIsCapturing] = React.useState(false)

  const form = useForm<ActionCaptureSchema>({
    resolver: zodResolver(actionCaptureSchema),
    defaultValues: {},
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = actionCaptureSchema.safeParse(values)
      if (parsed.success) {
        onValidInput({ kind: ActionKind.CAPTURE, schema: parsed.data })
      }
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

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
            if (isCapturing) {
              browser.runtime.sendMessage({ event: "stop-capture" })
            } else {
              browser.runtime.sendMessage({ event: "start-capture" })
            }
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
      </form>
    </Form>
  )
}
ActionCaptureForm.displayName = "ActionCaptureForm"

export default ActionCaptureForm
