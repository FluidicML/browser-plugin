import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import type { ActionNavigateSchema, ActionTab } from "./schema"
import { ActionKind, actionNavigateSchema } from "./schema"
import { Button } from "@/components/ui/button"
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
  onSubmit: (values: ActionTab["values"]) => void
}

const ActionNavigateForm = ({ onSubmit }: ActionNavigateFormProps) => {
  const form = useForm<ActionNavigateSchema>({
    resolver: zodResolver(actionNavigateSchema),
    defaultValues: { url: "" },
  })

  const onForwardSubmit = (values: ActionNavigateSchema) => {
    onSubmit({ kind: ActionKind.NAVIGATE, form: values })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onForwardSubmit)} className="space-y-8">
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
