import React from "react"
import { useForm } from "react-hook-form"

import { Checkbox } from "@/components/ui/checkbox"
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
import { useSharedStore } from "./store"

type SettingsFormData = {
  openaiApiKey: string
}

const SettingsTab = () => {
  const store = useSharedStore()
  const [apiKeyVisible, setApiKeyVisible] = React.useState(false)

  const form = useForm<SettingsFormData>({
    defaultValues: {
      openaiApiKey: store.openaiApiKey ?? undefined,
    },
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.openaiApiKey !== undefined) {
        store.actions.setOpenaiApiKey(values.openaiApiKey)
      }
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    <Form {...form}>
      <form className="space-y-4 p-4">
        <FormField
          control={form.control}
          name="openaiApiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormDescription>
                Used in <span className="font-bold">OpenAI</span> actions.
              </FormDescription>
              <FormControl>
                <Input
                  type={apiKeyVisible ? "text" : "password"}
                  placeholder="sk-*******"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 align-items">
          <Checkbox
            onCheckedChange={(checked) => setApiKeyVisible(!!checked)}
          />
          Toggle Visibility
        </div>
      </form>
    </Form>
  )
}
SettingsTab.displayName = "SettingsTab"

export default SettingsTab
