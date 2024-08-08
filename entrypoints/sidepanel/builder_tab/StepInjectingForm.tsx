import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { UseFormReturn, useFieldArray, useForm } from "react-hook-form"

import PlayIcon from "@/components/icons/Play"
import PlusIcon from "@/components/icons/Plus"
import StopIcon from "@/components/icons/Stop"
import TrashIcon from "@/components/icons/Trash"
import {
  type StepInjectingSchema,
  type Step,
  stepInjectingSchema,
} from "@/utils/schema"
import {
  Event,
  addMessageListener,
  removeMessageListener,
  sendTab,
} from "@/utils/messages"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { useSharedStore } from "../store"
import SelectorTable from "./SelectorTable"

type TargetCardProps = {
  form: UseFormReturn<StepInjectingSchema>
  index: number
  params: Set<string>
  onClick: () => void
  onRemove: () => void
  isActive: boolean
  disabled: boolean
}

const TargetCard = ({
  form,
  index,
  params,
  onClick,
  onRemove,
  isActive,
  disabled,
}: TargetCardProps) => {
  const name = form.watch(`targets.${index}.name`)
  const selector = form.watch(`targets.${index}.selector`)

  return (
    <Card>
      <CardContent className="flex flex-col relative">
        <div className="flex items-center gap-2">
          <FormField
            control={form.control}
            name={`targets.${index}.name`}
            render={({ field }) => (
              <FormItem className="grow">
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parameter to inject." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[...params].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {name && (
            <Button
              type="button"
              size="icon"
              onClick={onClick}
              disabled={disabled}
            >
              {isActive ? (
                <StopIcon className="w-5 h-5" />
              ) : (
                <PlayIcon className="w-5 h-5" />
              )}
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            className="group hover:bg-destructive/90"
            onClick={onRemove}
          >
            <TrashIcon className="w-5 h-5 stroke-white dark:stroke-black group-hover:stroke-white" />
          </Button>
        </div>
        {name && (
          <>
            <Separator className="my-4" />
            {selector ? (
              <SelectorTable selector={selector} />
            ) : (
              <span>Press record and choose an element.</span>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

type StepInjectingFormProps = {
  defaultValues: StepInjectingSchema | null
  onChange: (values: Step | null) => void
  params: Set<string>
}

const StepInjectingForm = ({
  defaultValues,
  onChange,
  params,
}: StepInjectingFormProps) => {
  const id = React.useId()
  const store = useSharedStore()
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

  const form = useForm<StepInjectingSchema>({
    resolver: zodResolver(stepInjectingSchema),
    defaultValues: defaultValues ?? { targets: [{ name: "", selector: "" }] },
  })

  const targets = useFieldArray({
    control: form.control,
    name: "targets",
  })

  React.useEffect(() => {
    return () => {
      sendTab(null, { event: Event.INJECTING_STOP, payload: null })
      store.sharedActions.unlock(id)
    }
  }, [store.sharedActions])

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = stepInjectingSchema.safeParse(values)
      onChange(
        parsed.success
          ? { kind: StepKind.INJECTING, values: parsed.data }
          : null
      )
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  React.useEffect(() => {
    if (activeIndex === null) {
      return
    }

    const name = form.watch(`targets.${activeIndex}.name`)
    const listener = addMessageListener((message) => {
      switch (message.event) {
        case Event.INJECTING_QUERY: {
          return Promise.resolve({ param: name, index: activeIndex })
        }
        case Event.INJECTING_CLICK: {
          targets.update(message.payload.index, {
            name: message.payload.param,
            selector: message.payload.selector,
          })
          break
        }
      }
    })

    return () => removeMessageListener(listener)
  }, [activeIndex, targets])

  if (params.size === 0) {
    return (
      <p>
        You have not defined any parameters yet. Consider using a{" "}
        <span className="font-bold">Prompt</span> step before this one.
      </p>
    )
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <p>
          Choose which parameters you want to inject into the page. For each,
          click "Start" and then the element on the page you want to inject
          into.
        </p>
        <div className="flex flex-col gap-4">
          {targets.fields.map((target, index) => (
            <TargetCard
              key={target.id}
              form={form}
              index={index}
              params={params}
              onClick={() => {
                if (activeIndex === null) {
                  sendTab(null, {
                    event: Event.INJECTING_START,
                    payload: {
                      param: form.watch(`targets.${index}.name`),
                      index,
                    },
                  }).then(() => {
                    store.sharedActions.lock(id)
                    setActiveIndex(index)
                  })
                } else {
                  sendTab(null, {
                    event: Event.INJECTING_STOP,
                    payload: null,
                  }).then(() => {
                    store.sharedActions.unlock(id)
                    setActiveIndex(null)
                  })
                }
              }}
              onRemove={() => {
                targets.remove(index)
                if (activeIndex === index) {
                  setActiveIndex(null)
                }
              }}
              isActive={activeIndex === index}
              disabled={activeIndex !== null && activeIndex !== index}
            />
          ))}
          <Button
            type="button"
            className="w-full flex gap-2"
            onClick={() => targets.append({ name: "", selector: "" })}
          >
            <PlusIcon className="w-3 h-3 fill-white dark:fill-black" />
            Add Field
          </Button>
        </div>
      </form>
    </Form>
  )
}
StepInjectingForm.displayName = "StepInjectingForm"

export default StepInjectingForm
