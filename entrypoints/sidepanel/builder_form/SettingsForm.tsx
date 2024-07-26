import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z
  .object({
    workflowName: z.string().min(1, {
      message: "You must provide a workflow name.",
    }),
    launchUrl: z.string().url({
      message: "This must provide a valid URL.",
    }),
  })
  .strict()
  .required()

type SettingsFormProps = {
  onSubmit: (values: z.infer<typeof formSchema>) => void
}

const SettingsForm = ({ onSubmit }: SettingsFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workflowName: "",
      launchUrl: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4">
        <FormField
          control={form.control}
          name="workflowName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workflow Name</FormLabel>
              <FormControl>
                <Input placeholder="The name of your workflow" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="launchUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Starting URL</FormLabel>
              <FormDescription>
                All workflows start in a new tab. Specify the URL this workflow
                should begin at.
              </FormDescription>
              <FormControl>
                <Input placeholder="Start workflow from this URL" {...field} />
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
SettingsForm.displayName = "SettingsForm"

export default SettingsForm
