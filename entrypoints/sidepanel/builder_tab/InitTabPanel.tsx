import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { type InitSchema, initSchema } from "@/utils/schema"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

type InitTabPanelProps = {
  defaultValues: InitSchema | null
  onChange: (values: InitSchema | null) => void
}

const InitTabPanel = ({ defaultValues, onChange }: InitTabPanelProps) => {
  const form = useForm<InitSchema>({
    resolver: zodResolver(initSchema),
    defaultValues: defaultValues ?? { name: "" },
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
        <p>
          Build a new workflow. All steps run relative to whichever page you
          have open at time of running. For consistency, consider making the
          first action a <span className="font-bold">Navigate</span>.
        </p>
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
      </form>
    </Form>
  )
}
InitTabPanel.displayName = "InitTabPanel"

export default InitTabPanel
