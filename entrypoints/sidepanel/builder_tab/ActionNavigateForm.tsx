import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import type { ActionNavigateSchema, ActionForm } from "@/utils/workflow"
import { ActionKind, actionNavigateSchema } from "@/utils/workflow"
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
  onValidInput: (values: ActionForm) => void
}

const ActionNavigateForm = ({ onValidInput }: ActionNavigateFormProps) => {
  const form = useForm<ActionNavigateSchema>({
    resolver: zodResolver(actionNavigateSchema),
    defaultValues: { url: "" },
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = actionNavigateSchema.safeParse(values)
      if (parsed.success) {
        onValidInput({ kind: ActionKind.NAVIGATE, values: parsed.data })
      }
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    <Form {...form}>
      <form className="space-y-8">
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
