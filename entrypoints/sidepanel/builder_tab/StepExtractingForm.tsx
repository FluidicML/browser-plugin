import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Control, useFieldArray, useForm } from "react-hook-form"

import {
  type StepExtractingSchema,
  type Step,
  stepExtractingSchema,
} from "@/utils/schema"
import {
  addMessageListener,
  removeMessageListener,
  sendTab,
} from "@/utils/messages"
import { Event } from "@/utils/event"
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
import SelectorTable from "./SelectorTable"

type ActionCardProps = {
  control: Control<StepExtractingSchema>
  index: number
  selector: Selector
  onRemove: () => void
}

const ActionCard = ({
  control,
  index,
  selector,
  onRemove,
}: ActionCardProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col relative">
        <FormField
          control={control}
          name={`params.${index}.name`}
          render={({ field }) => (
            // This form field also forces the form to scroll to the bottom
            // automatically when new entries are inserted. If removed, make
            // sure we still continue automatically scrolling.
            <FormItem>
              <FormControl>
                <Input className="mb-4" placeholder="Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="button"
          size="xicon"
          className="absolute right-1 top-1 group hover:bg-destructive/90"
          onClick={onRemove}
        >
          <TrashIcon className="w-5 h-5 stroke-white dark:stroke-black group-hover:stroke-white" />
        </Button>
        <SelectorTable selector={selector} />
      </CardContent>
    </Card>
  )
}

type StepExtractingFormProps = {
  defaultValues: StepExtractingSchema | null
  onChange: (values: Step | null) => void
}

const StepExtractingForm = ({
  defaultValues,
  onChange,
}: StepExtractingFormProps) => {
  const id = React.useId()
  const store = useSharedStore()
  const [isExtracting, setIsExtracting] = React.useState(false)

  const toggleExtracting = React.useCallback(async () => {
    try {
      if (isExtracting) {
        await sendTab(null, {
          event: Event.EXTRACTING_STOP,
          payload: null,
        })
      } else {
        await sendTab(null, {
          event: Event.EXTRACTING_START,
          payload: null,
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      if (isExtracting) {
        store.sharedActions.unlock(id)
        setIsExtracting(false)
      } else {
        setIsExtracting(true)
        store.sharedActions.lock(id)
      }
    }
  }, [isExtracting, setIsExtracting, store.sharedActions])

  const form = useForm<StepExtractingSchema>({
    resolver: zodResolver(stepExtractingSchema),
    defaultValues: defaultValues ?? { params: [] },
  })

  const params = useFieldArray({
    control: form.control,
    name: "params",
  })

  React.useEffect(() => {
    return () => {
      sendTab(null, { event: Event.EXTRACTING_STOP, payload: null })
      store.sharedActions.unlock(id)
    }
  }, [store.sharedActions])

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = stepExtractingSchema.safeParse(values)
      onChange(
        parsed.success
          ? { kind: StepKind.EXTRACTING, values: parsed.data }
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
        case Event.EXTRACTING_QUERY: {
          return Promise.resolve(true)
        }
        case Event.EXTRACTING_CLICK: {
          params.append({ name: "", selector: message.payload })
          break
        }
      }
    })
    return () => removeMessageListener(listener)
  }, [isExtracting, params])

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <p>
          Click "Start" and then click on elements whose text you want to
          extract.
        </p>
        <Button
          type="button"
          className="w-full flex gap-2"
          onClick={toggleExtracting}
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
              <ActionCard
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
StepExtractingForm.displayName = "StepExtractingForm"

export default StepExtractingForm
