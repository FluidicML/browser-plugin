import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  type ActionNavigateSchema,
  type ActionForm,
  ActionKind,
  actionNavigateSchema,
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

type ActionNavigateFormProps = {
  defaultValues: ActionNavigateSchema | null
  onChange: (values: ActionForm | null) => void
}

const ActionNavigateForm = ({
  defaultValues,
  onChange,
}: ActionNavigateFormProps) => {
  const form = useForm<ActionNavigateSchema>({
    resolver: zodResolver(actionNavigateSchema),
    defaultValues: defaultValues ?? { url: "" },
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = actionNavigateSchema.safeParse(values)
      onChange(
        parsed.success
          ? { kind: ActionKind.NAVIGATE, values: parsed.data }
          : null
      )
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    <Form {...form}>
      <form className="space-y-4">
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
ActionNavigateForm.displayName = "ActionNavigateForm"

export default ActionNavigateForm
