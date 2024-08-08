import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { type InitSchema, initSchema } from "$/utils/schema"
import { TabsContent } from "$/components/ui/tabs"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "$/components/ui/form"
import { Input } from "$/components/ui/input"
import { useSharedStore } from "../store"

type InitTabPanelProps = Omit<
  React.ComponentPropsWithoutRef<typeof TabsContent>,
  "onChange"
> & {
  defaultValues: InitSchema | null
  onChange: (values: InitSchema | null) => void
}

const InitTabPanel = React.forwardRef<
  React.ElementRef<typeof TabsContent>,
  InitTabPanelProps
>(({ defaultValues, onChange, ...props }, ref) => {
  const store = useSharedStore()

  const form = useForm<InitSchema>({
    resolver: zodResolver(initSchema),
    defaultValues: defaultValues ?? {
      name: `Untitled #${store.librarySaved.length + 1}`,
    },
  })

  React.useEffect(() => {
    const parsed = initSchema.safeParse(form.getValues())
    onChange(parsed.success ? parsed.data : null)

    const subscription = form.watch((values) => {
      const parsed = initSchema.safeParse(values)
      onChange(parsed.success ? parsed.data : null)
    })

    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    <TabsContent ref={ref} {...props}>
      <Form {...form}>
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
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
    </TabsContent>
  )
})
InitTabPanel.displayName = "InitTabPanel"

export default InitTabPanel
