import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

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
import { Textarea } from "@/components/ui/textarea"

type ActionPromptFormProps = {
  onValidInput: (values: ActionForm) => void
}

const ActionPromptForm = ({ onValidInput }: ActionPromptFormProps) => {
  const form = useForm<ActionPromptSchema>({
    resolver: zodResolver(actionPromptSchema),
    defaultValues: { system: "", user: "" },
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = actionPromptSchema.safeParse(values)
      if (parsed.success) {
        onValidInput({ kind: ActionKind.PROMPT, values: parsed.data })
      }
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    <Form {...form}>
      <form className="space-y-8">
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
                <Textarea rows={10} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
ActionPromptForm.displayName = "ActionPromptForm"

export default ActionPromptForm
