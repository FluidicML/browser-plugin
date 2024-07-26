import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import type { ActionPromptSchema, ActionTab } from "./schema"
import { ActionKind, actionPromptSchema } from "./schema"
import { Button } from "@/components/ui/button"
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
  onSubmit: (values: ActionTab["values"]) => void
}

const ActionPromptForm = ({ onSubmit }: ActionPromptFormProps) => {
  const form = useForm<ActionPromptSchema>({
    resolver: zodResolver(actionPromptSchema),
    defaultValues: { system: "", user: "" },
  })

  const onForwardSubmit = (values: ActionPromptSchema) => {
    onSubmit({ kind: ActionKind.PROMPT, form: values })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onForwardSubmit)} className="space-y-8">
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
