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
  onSubmit: (values: ActionTab["values"]) => void
}

const ActionCaptureForm = ({ onSubmit }: ActionCaptureFormProps) => {
  const [isCapturing, setIsCapturing] = React.useState(false)

  const form = useForm<ActionCaptureSchema>({
    resolver: zodResolver(actionCaptureSchema),
    defaultValues: {},
  })

  const onForwardSubmit = (values: ActionCaptureSchema) => {
    onSubmit({ kind: ActionKind.CAPTURE, form: values })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onForwardSubmit)} className="space-y-8">
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
