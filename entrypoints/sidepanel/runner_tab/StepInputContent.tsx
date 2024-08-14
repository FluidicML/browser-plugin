import React from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Control, SubmitHandler, useFieldArray, useForm } from "react-hook-form"

import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useSharedStore } from "../store"
import { type StepContentProps } from "./StepContent"

const stepInputContentSchema = z.object({
  params: z
    .array(
      z.object({
        name: z.string().min(1, {
          message: "You must provide a valid name.",
        }),
        value: z.string().min(1, {
          message: "You must provide a valid value.",
        }),
      })
    )
    .nonempty(),
})

type StepInputContentSchema = z.infer<typeof stepInputContentSchema>

type ParameterFieldProps = {
  control: Control<StepInputContentSchema>
  label: string
  index: number
}

const ParameterField = ({ control, label, index }: ParameterFieldProps) => {
  return (
    <div className="flex flex-col gap-1">
      <FormField
        control={control}
        name={`params.${index}.name`}
        render={({ field }) => <Input type="hidden" {...field} />}
      />
      <FormField
        control={control}
        name={`params.${index}.value`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">{label}</FormLabel>
            <FormControl>
              <Input className="mt-2 text-xs" placeholder="Value" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

const StepInputContent = ({
  values,
  result,
}: StepContentProps<StepInputSchema>) => {
  const store = useSharedStore()
  const latest = result?.results[result.results.length - 1] ?? null

  const form = useForm<StepInputContentSchema>({
    resolver: zodResolver(stepInputContentSchema),
    defaultValues: {
      params: values.params.map((p) => ({ name: p.name, value: "" })),
    },
  })

  const params = useFieldArray({
    control: form.control,
    name: "params",
  })

  const onSubmit: SubmitHandler<StepInputContentSchema> = (values) => {
    if (store.runnerActive === null) {
      return
    }
    store.runnerActions.popTaskResult(store.runnerActive)
    store.runnerActions.pushTaskResult(store.runnerActive, {
      status: TaskStatus.SUCCEEDED,
      params: values.params.map((p) => [p.name, p.value]),
    })
  }

  if (latest === null || result === null) {
    return <span>Loading...</span>
  }

  if (latest.status === TaskStatus.FAILED) {
    return <span>{latest.message ?? "Unknown error."}</span>
  }

  if (latest.isPaused) {
    return (
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <p>Fill out all parameters.</p>
          <Separator />
          <div className="flex flex-col gap-4">
            {...values.params.map((p, index) => (
              <ParameterField
                key={params.fields[index].id}
                control={form.control}
                label={p.name}
                index={index}
              />
            ))}
          </div>
          <Input type="submit" />
        </form>
      </Form>
    )
  }

  return <span>{latest.message ?? "Finished prompting."}</span>
}
StepInputContent.displayName = "StepInputContent"

export default StepInputContent
