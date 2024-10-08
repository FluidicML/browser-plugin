import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Control, useFieldArray, useForm } from "react-hook-form"

import PlusIcon from "@/components/icons/Plus"
import TrashIcon from "@/components/icons/Trash"
import {
  type StepOpenAISchema,
  type Step,
  StepKind,
  stepOpenAISchema,
} from "@/utils/schema"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSharedStore } from "../store"

type ParameterFieldProps = {
  control: Control<StepOpenAISchema>
  index: number
  onRemove: () => void
}

const ParameterField = ({ control, index, onRemove }: ParameterFieldProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-end">
        <FormField
          control={control}
          name={`params.${index}.name`}
          render={({ field }) => (
            <FormItem className="grow">
              <FormLabel>JSON Field {index + 1}</FormLabel>
              <FormControl>
                <Input className="mt-2" placeholder="Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="button"
          size="icon"
          className="group hover:bg-destructive/90"
          onClick={onRemove}
        >
          <TrashIcon className="w-5 h-5 stroke-white dark:stroke-black group-hover:stroke-white" />
        </Button>
      </div>
      <FormField
        control={control}
        name={`params.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea className="mt-2" placeholder="Description" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

type StepOpenAIFormProps = {
  defaultValues: StepOpenAISchema | null
  onChange: (values: Step | null) => void
}

const StepOpenAIForm = ({ defaultValues, onChange }: StepOpenAIFormProps) => {
  const store = useSharedStore()

  const form = useForm<StepOpenAISchema>({
    resolver: zodResolver(stepOpenAISchema),
    defaultValues: defaultValues ?? {
      system: "",
      user: "",
      params: [{ name: "", description: "" }],
    },
  })

  const params = useFieldArray({
    control: form.control,
    name: "params",
  })

  React.useEffect(() => {
    if (!store.settingsOpenAIKey) {
      onChange(null)
      return
    }

    const parsed = stepOpenAISchema.safeParse(form.getValues())
    onChange(
      parsed.success ? { kind: StepKind.OPENAI, values: parsed.data } : null
    )

    const subscription = form.watch((values) => {
      const parsed = stepOpenAISchema.safeParse(values)
      onChange(
        parsed.success ? { kind: StepKind.OPENAI, values: parsed.data } : null
      )
    })

    return () => subscription.unsubscribe()
  }, [store.settingsOpenAIKey, form.watch])

  if (store.settingsOpenAIKey === "") {
    return (
      <p>
        To create an <span className="font-bold">OpenAI</span> step, you must
        set an API key. Do so in the <span className="font-bold">Settings</span>{" "}
        tab.
      </p>
    )
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <p>Send a chat completion request to OpenAI.</p>
        <FormField
          control={form.control}
          name="system"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System Prompt</FormLabel>
              <FormControl>
                <Textarea
                  className="mt-2"
                  placeholder="You are a useful assistant for..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="user"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Prompt</FormLabel>
              <FormControl>
                <Textarea
                  className="mt-2"
                  placeholder="Craft a concise request for..."
                  rows={10}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p>
          Values returned in the JSON-formatted response. These can be accessed
          in subsequent steps.
        </p>
        <div className="flex flex-col gap-4">
          {...params.fields.map((field, index) => (
            <ParameterField
              key={field.id}
              control={form.control}
              index={index}
              onRemove={() => params.remove(index)}
            />
          ))}
          <Button
            type="button"
            className="w-full flex gap-2"
            onClick={() => params.append({ name: "", description: "" })}
          >
            <PlusIcon className="w-3 h-3 fill-white dark:fill-black" />
            Add Field
          </Button>
        </div>
      </form>
    </Form>
  )
}
StepOpenAIForm.displayName = "StepOpenAIForm"

export default StepOpenAIForm
