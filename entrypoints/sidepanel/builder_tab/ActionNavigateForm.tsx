import React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Form } from "@/components/ui/form"

const formSchema = z
  .object({
    example: z.string().min(1, {
      message: "You must provide a workflow name.",
    }),
  })
  .strict()
  .required()

type ActionNavigateFormProps = {
  onSubmit: (values: z.infer<typeof formSchema>) => void
}

const ActionNavigateForm = ({ onSubmit }: ActionNavigateFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      example: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <input type="text" placeholder="navigate" />
      </form>
    </Form>
  )
}
ActionNavigateForm.displayName = "ActionNavigateForm"

export default ActionNavigateForm
