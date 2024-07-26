import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { type InitTabSchema, initTabSchema } from "./schema"
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

type InitTabPanelProps = {
  onSubmit: (values: InitTabSchema) => void
}

const InitTabPanel = ({ onSubmit }: InitTabPanelProps) => {
  const form = useForm<InitTabSchema>({
    resolver: zodResolver(initTabSchema),
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
InitTabPanel.displayName = "InitTabPanel"

export default InitTabPanel
