import React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"

const formSchema = z.object({}).strict().required()

type ActionCaptureFormProps = {
  onSubmit: (values: z.infer<typeof formSchema>) => void
}

const ActionCaptureForm = ({ onSubmit }: ActionCaptureFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <p>
          Pending. This should track discrete events like other workflow capture
          builders.
        </p>
        <Button className="w-full" type="submit">
          Continue
        </Button>
      </form>
    </Form>
  )
}
ActionCaptureForm.displayName = "ActionCaptureForm"

export default ActionCaptureForm
