import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { type InitSchema, initSchema } from "@/utils/schema"
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
  onChange: (values: InitSchema | null) => void
}

const InitTabPanel = ({ onChange }: InitTabPanelProps) => {
  const form = useForm<InitSchema>({
    resolver: zodResolver(initSchema),
    defaultValues: { name: "", url: "" },
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = initSchema.safeParse(values)
      onChange(parsed.success ? parsed.data : null)
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    <Form {...form}>
      <form className="space-y-8">
        <FormField
          control={form.control}
          name="name"
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
          name="url"
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
      </form>
    </Form>
  )
}
InitTabPanel.displayName = "InitTabPanel"

export default InitTabPanel
