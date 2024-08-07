import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  type StepNavigateSchema,
  type Step,
  StepKind,
  stepNavigateSchema,
} from "@/utils/schema"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

type StepNavigateFormProps = {
  defaultValues: StepNavigateSchema | null
  onChange: (values: Step | null) => void
}

const StepNavigateForm = ({
  defaultValues,
  onChange,
}: StepNavigateFormProps) => {
  const form = useForm<StepNavigateSchema>({
    resolver: zodResolver(stepNavigateSchema),
    defaultValues: defaultValues ?? { url: "" },
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = stepNavigateSchema.safeParse(values)
      onChange(
        parsed.success ? { kind: StepKind.NAVIGATE, values: parsed.data } : null
      )
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <p>
          Navigate directly to the specified URL. Prefer{" "}
          <span className="font-bold">Recording</span> if you can navigate by
          clicking on a link.
        </p>
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://fluidicml.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
StepNavigateForm.displayName = "StepNavigateForm"

export default StepNavigateForm
