import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Control, useFieldArray, useForm } from "react-hook-form"

import PlusIcon from "@/components/icons/Plus"
import TrashIcon from "@/components/icons/Trash"
import {
  type StepPromptSchema,
  type Step,
  StepKind,
  stepPromptSchema,
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

type ParameterFieldProps = {
  control: Control<StepPromptSchema>
  index: number
  onRemove: () => void
}

const ParameterField = ({ control, index, onRemove }: ParameterFieldProps) => {
  return (
    <div className="flex items-end gap-2">
      <FormField
        control={control}
        name={`params.${index}.name`}
        render={({ field }) => (
          <FormItem className="grow">
            <FormLabel>Field {index + 1}</FormLabel>
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
  )
}

type StepPromptFormProps = {
  defaultValues: StepPromptSchema | null
  onChange: (values: Step | null) => void
}

const StepPromptForm = ({ defaultValues, onChange }: StepPromptFormProps) => {
  const form = useForm<StepPromptSchema>({
    resolver: zodResolver(stepPromptSchema),
    defaultValues: defaultValues ?? { params: [{ name: "" }] },
  })
  const params = useFieldArray({
    control: form.control,
    name: "params",
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = stepPromptSchema.safeParse(values)
      onChange(
        parsed.success ? { kind: StepKind.PROMPT, values: parsed.data } : null
      )
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <p>
          Specify any number of key/value pairs. These will be prompted at
          runtime and available in all subsequent steps.
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
            onClick={() => params.append({ name: "" })}
          >
            <PlusIcon className="w-3 h-3 fill-white dark:fill-black" />
            Add Field
          </Button>
        </div>
      </form>
    </Form>
  )
}
StepPromptForm.displayName = "StepPromptForm"

export default StepPromptForm
