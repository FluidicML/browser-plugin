import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Control, useFieldArray, useForm } from "react-hook-form"

import type { ActionExtractingSchema, ActionForm } from "@/utils/workflow"
import { ActionKind, actionExtractingSchema } from "@/utils/workflow"
import {
  MessageEvent,
  addMessageListener,
  removeMessageListener,
  broadcastTabs,
} from "@/utils/messages"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import PlayIcon from "@/components/icons/Play"
import StopIcon from "@/components/icons/Stop"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSharedStore } from "../store"

type ExtractionCardProps = {
  index: number
  control: Control<ActionExtractingSchema>
}

const ExtractionCard = ({ index, control }: ExtractionCardProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <FormField
          control={control}
          name={`extractions.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        LOCATOR
      </CardContent>
    </Card>
  )
}

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
        case MessageEvent.EXTRACTING_CLICK: {
          extractions.append({ name: "", locator: message.payload })
          break
        }
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
        <p>Name each extraction for insertion into subsequent steps.</p>
        <div className="flex flex-col gap-4">
          {[...Array(extractions.fields.length).keys()].map((index) => {
            return (
              <ExtractionCard
                key={extractions.fields[index].id}
                index={index}
                control={form.control}
              />
            )
          })}
        </div>
      </form>
    </Form>
  )
}
ActionExtractingForm.displayName = "ActionExtractingForm"

export default ActionExtractingForm
