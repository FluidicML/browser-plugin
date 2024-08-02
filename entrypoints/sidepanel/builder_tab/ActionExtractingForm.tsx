import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Control, useFieldArray, useForm } from "react-hook-form"

import {
  type ActionExtractingSchema,
  type ActionForm,
  ActionKind,
  actionExtractingSchema,
} from "@/utils/schema"
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
  FormMessage,
} from "@/components/ui/form"
import PlayIcon from "@/components/icons/Play"
import StopIcon from "@/components/icons/Stop"
import TrashIcon from "@/components/icons/Trash"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSharedStore } from "../store"
import LocatorTable from "./LocatorTable"

type ParameterCardProps = {
  control: Control<ActionExtractingSchema>
  index: number
  selector: Selector
  onRemove: () => void
}

const ParameterCard = ({
  control,
  index,
  selector,
  onRemove,
}: ParameterCardProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col relative">
        <FormField
          control={control}
          name={`params.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input className="mb-4" placeholder="Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          size="xicon"
          className="absolute right-1 top-1 group hover:bg-destructive/90"
          onClick={onRemove}
        >
          <TrashIcon className="w-5 h-5 stroke-white dark:stroke-black group-hover:stroke-white" />
        </Button>
        <div className="overflow-x-auto scrollbar">
          {typeof selector === "string" ? (
            <pre>{selector}</pre>
          ) : (
            <LocatorTable locator={selector} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

type ActionExtractingFormProps = {
  defaultValues: ActionExtractingSchema | null
  onChange: (values: ActionForm | null) => void
}

const ActionExtractingForm = ({
  defaultValues,
  onChange,
}: ActionExtractingFormProps) => {
  const id = React.useId()
  const store = useSharedStore()
  const [isExtracting, setIsExtracting] = React.useState(false)

  const form = useForm<ActionExtractingSchema>({
    resolver: zodResolver(actionExtractingSchema),
    defaultValues: defaultValues ?? { params: [] },
  })

  const params = useFieldArray({
    control: form.control,
    name: "params",
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
          params.append({ name: "", selector: message.payload })
          break
        }
      }
    })
    return () => removeMessageListener(listener)
  }, [isExtracting, params])

  return (
    <Form {...form}>
      <form className="space-y-4">
        <p>
          Click "Start" and then click on elements whose text you want to
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
        {params.fields.length > 0 && (
          <div className="flex flex-col gap-4">
            <p>Name each extraction for insertion into subsequent steps.</p>
            {params.fields.map((param, index) => (
              <ParameterCard
                key={param.id}
                control={form.control}
                index={index}
                selector={param.selector}
                onRemove={() => params.remove(index)}
              />
            ))}
          </div>
        )}
      </form>
    </Form>
  )
}
ActionExtractingForm.displayName = "ActionExtractingForm"

export default ActionExtractingForm
