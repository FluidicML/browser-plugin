import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Control, useFieldArray, useForm } from "react-hook-form"

import PlusIcon from "@/components/icons/Plus"
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
}

const ParameterField = ({ control, index }: ParameterFieldProps) => {
  return (
    <div className="flex flex-col gap-2">
      <FormField
        control={control}
        name={`params.${index}.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field {index + 1}</FormLabel>
            <FormControl>
              <Input placeholder="Name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
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
