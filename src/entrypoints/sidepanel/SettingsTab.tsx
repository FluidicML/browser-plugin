import React from "react"
import { useForm } from "react-hook-form"

import { Checkbox } from "$/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "$/components/ui/form"
import { Input } from "$/components/ui/input"
import { useSharedStore } from "./store/index"

type SettingsFormData = {
  openaiApiKey: string
}

const SettingsTab = () => {
  const store = useSharedStore()
  const [apiKeyVisible, setApiKeyVisible] = React.useState(false)

  const form = useForm<SettingsFormData>({
    defaultValues: {
      openaiApiKey: store.settingsOpenAIKey ?? undefined,
    },
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.openaiApiKey !== undefined) {
        store.settingsActions.setOpenAIKey(values.openaiApiKey)
      }
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    <Form {...form}>
      <form className="space-y-4 p-4" onSubmit={(e) => e.preventDefault()}>
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
          <Checkbox onCheckedChange={(v) => setApiKeyVisible(!!v)} />
          Toggle Visibility
        </div>
      </form>
    </Form>
  )
}
SettingsTab.displayName = "SettingsTab"

export default SettingsTab
