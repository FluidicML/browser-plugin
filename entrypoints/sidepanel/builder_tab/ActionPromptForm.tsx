import React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

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

const formSchema = z
  .object({
    example: z.string().min(1, {
      message: "You must provide a workflow name.",
    }),
  })
  .strict()
  .required()

type ActionPromptFormProps = {
  onSubmit: (values: z.infer<typeof formSchema>) => void
}

const ActionPromptForm = ({ onSubmit }: ActionPromptFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      example: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="example"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Example</FormLabel>
              <FormControl>
                <Input placeholder="prompt" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit">
          Continue
        </Button>
      </form>
    </Form>
  )
}
ActionPromptForm.displayName = "ActionPromptForm"

export default ActionPromptForm
