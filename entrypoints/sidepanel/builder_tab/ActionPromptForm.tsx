import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Control, useFieldArray, useForm } from "react-hook-form"

import PlusIcon from "@/components/icons/Plus"
import type { ActionPromptSchema, ActionForm } from "@/utils/workflow"
import { ActionKind, actionPromptSchema } from "@/utils/workflow"
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

type InterpolationFieldProps = {
  control: Control<ActionPromptSchema>
  index: number
}

const InterpolationField = ({ control, index }: InterpolationFieldProps) => {
  return (
    <div className="flex flex-col gap-2">
      <FormField
        control={control}
        name={`interpolations.${index}.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Response {index + 1}</FormLabel>
            <FormControl>
              <Input placeholder="name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`interpolations.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea placeholder="description" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

type ActionPromptFormProps = {
  onChange: (values: ActionForm | null) => void
}

const ActionPromptForm = ({ onChange }: ActionPromptFormProps) => {
  const form = useForm<ActionPromptSchema>({
    resolver: zodResolver(actionPromptSchema),
    defaultValues: {
      system: "",
      user: "",
      interpolations: [{ name: "", description: "" }],
    },
  })

  const interpolations = useFieldArray({
    control: form.control,
    name: "interpolations",
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = actionPromptSchema.safeParse(values)
      onChange(
        parsed.success ? { kind: ActionKind.PROMPT, values: parsed.data } : null
      )
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="system"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System Prompt</FormLabel>
              <FormControl>
                <Textarea
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
          Define what values should be returned in the response for
          interpolation into subsequent steps.
        </p>
        <div className="flex flex-col gap-4">
          {...interpolations.fields.map((field, index) => (
            <InterpolationField
              key={field.id}
              control={form.control}
              index={index}
            />
          ))}
          <Button
            className="w-full flex gap-2"
            onClick={() => interpolations.append({ name: "", description: "" })}
          >
            <PlusIcon className="w-3 h-3 fill-white dark:fill-black" />
            Add Response Field
          </Button>
        </div>
      </form>
    </Form>
  )
}
ActionPromptForm.displayName = "ActionPromptForm"

export default ActionPromptForm
