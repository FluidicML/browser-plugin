import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"

import type { ActionExtractingSchema, ActionForm } from "@/utils/workflow"
import { ActionKind, actionExtractingSchema } from "@/utils/workflow"
import {
  MessageEvent,
  addMessageListener,
  removeMessageListener,
  broadcastTabs,
} from "@/utils/messages"
import PlayIcon from "@/components/icons/Play"
import StopIcon from "@/components/icons/Stop"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { useSharedStore } from "../store"

type ActionExtractingFormProps = {
  onChange: (values: ActionForm | null) => void
}

const ActionExtractingForm = ({ onChange }: ActionExtractingFormProps) => {
  const id = React.useId()
  const store = useSharedStore()
  const [isExtracting, setIsExtracting] = React.useState(false)

  const form = useForm<ActionExtractingSchema>({
    resolver: zodResolver(actionExtractingSchema),
    defaultValues: { extractions: [] },
  })

  const extractions = useFieldArray({
    control: form.control,
    name: "extractions",
  })

  React.useEffect(() => {
    return () => {
      broadcastTabs({ event: MessageEvent.EXTRACTING_STOP, payload: null })
      store.actions.unlock(id)
    }
  }, [store.actions])

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = actionExtractingSchema.safeParse(values)
      onChange(
        parsed.success
          ? { kind: ActionKind.EXTRACTING, values: parsed.data }
          : null
      )
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  React.useEffect(() => {
    if (!isExtracting) {
      return
    }
    const listener = addMessageListener((message) => {
      switch (message.event) {
      }
    })
    return () => removeMessageListener(listener)
  }, [isExtracting, extractions])

  return (
    <Form {...form}>
      <form className="space-y-4">
        <p>
          Click "Start" and then click on elements whose content you want to
          extract.
        </p>
        <Button
          type="button"
          className="w-full flex gap-2"
          onClick={() => {
            if (isExtracting) {
              broadcastTabs({
                event: MessageEvent.EXTRACTING_STOP,
                payload: null,
              }).then(() => {
                store.actions.unlock(id)
                setIsExtracting(false)
              })
            } else {
              broadcastTabs({
                event: MessageEvent.EXTRACTING_START,
                payload: null,
              }).then(() => {
                setIsExtracting(true)
                store.actions.lock(id)
              })
            }
          }}
        >
          {isExtracting ? (
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
ActionExtractingForm.displayName = "ActionExtractingForm"

export default ActionExtractingForm
