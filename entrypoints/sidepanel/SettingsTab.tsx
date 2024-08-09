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
  replayTimeoutSecs: number
}

const SettingsTab = () => {
  const store = useSharedStore()
  const [apiKeyVisible, setApiKeyVisible] = React.useState(false)

  const form = useForm<SettingsFormData>({
    defaultValues: {
      openaiApiKey: store.settingsOpenAIKey ?? undefined,
      replayTimeoutSecs: store.settingsReplayTimeoutSecs ?? undefined,
    },
  })

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.openaiApiKey !== undefined) {
        store.settingsActions.setOpenAIKey(values.openaiApiKey)
      }
      if (values.replayTimeoutSecs !== undefined) {
        store.settingsActions.setReplayTimeoutSecs(values.replayTimeoutSecs)
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

        <FormField
          control={form.control}
          name="replayTimeoutSecs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Replay Timeout</FormLabel>
              <FormDescription>
                How long we wait (in seconds) for a page to load, an element to
                appear, etc. before potentially failing.
              </FormDescription>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
SettingsTab.displayName = "SettingsTab"

export default SettingsTab
