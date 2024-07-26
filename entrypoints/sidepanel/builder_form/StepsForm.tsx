import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { ComboBox } from "@/components/ui/combobox"
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

const Action = ["click", "navigate", "prompt"] as const

const formSchema = z
  .object({
    action: z.enum(Action),
  })
  .strict()
  .required()

type StepsFormProps = {
  workflowName: string
  launchUrl: string
}
const StepsForm = (_props: StepsFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      action: "click",
    },
  })

  return (
    <Form {...form}>
      <form className="space-y-8 p-4">
        <FormField
          control={form.control}
          name="action"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Action Type</FormLabel>
              <FormDescription>
                Specify the type of action you want to automate next.
              </FormDescription>
              <FormControl>
                <ComboBox
                  value={field.value}
                  options={Action.map((key) => ({
                    value: key,
                    label: key.slice(0, 1).toUpperCase() + key.slice(1),
                  }))}
                  onSelect={(value) => {
                    // @ts-ignore
                    form.setValue("action", value)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
StepsForm.displayName = "StepsForm"

export default StepsForm
