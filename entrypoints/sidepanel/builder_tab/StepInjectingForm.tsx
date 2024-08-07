import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Control, useFieldArray, useForm } from "react-hook-form"

import {
  type StepInjectingSchema,
  type Step,
  stepInjectingSchema,
} from "@/utils/schema"
import {
  Event,
  addMessageListener,
  removeMessageListener,
  broadcastTabs,
} from "@/utils/messages"
import { Form, FormField } from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { useSharedStore } from "../store"

type ParameterCardProps = {
  control: Control<StepInjectingSchema>
  index: number
  selector: Selector
}

const ParameterCard = ({ control, index, selector }: ParameterCardProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col relative">
        <FormField
          control={control}
          name={`params.${index}.name`}
          render={({ field }) => <Select {...field} />}
        />
      </CardContent>
    </Card>
  )
}

type StepInjectingFormProps = {
  defaultValues: StepInjectingSchema | null
  onChange: (values: Step | null) => void
}

const StepInjectingForm = ({
  defaultValues,
  onChange,
}: StepInjectingFormProps) => {
  const id = React.useId()
  const store = useSharedStore()
  const [isInjecting, setIsInjecting] = React.useState(false)

  const form = useForm<StepInjectingSchema>({
    resolver: zodResolver(stepInjectingSchema),
    defaultValues: defaultValues ?? { params: [{ name: "", selector: "" }] },
  })

  const params = useFieldArray({
    control: form.control,
    name: "params",
  })

  React.useEffect(() => {
    return () => {
      broadcastTabs({ event: Event.INJECTING_STOP, payload: null })
      store.sharedActions.unlock(id)
    }
  }, [store.sharedActions])

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = stepInjectingSchema.safeParse(values)
      // onChange(
      //   parsed.success
      //     ? { kind: StepKind.INJECTING, values: parsed.data }
      //     : null
      // )
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  React.useEffect(() => {
    if (!isInjecting) {
      return
    }
    const listener = addMessageListener((message) => {
      switch (message.event) {
        case Event.INJECTING_CLICK: {
          // params.append({ name: "", selector: message.payload })
          break
        }
      }
    })
    return () => removeMessageListener(listener)
  }, [isInjecting, params])

  return (
    <Form {...form}>
      <form className="space-y-4">
        <p>
          Choose which parameter you want to inject into the page. Click "Start"
          and then click on the element you want to inject its contents into.
        </p>
        {params.fields.length > 0 && (
          <div className="flex flex-col gap-4">
            {params.fields.map((param, index) => (
              <ParameterCard
                key={param.id}
                control={form.control}
                index={index}
                selector={param.selector}
              />
            ))}
          </div>
        )}
      </form>
    </Form>
  )
}
StepInjectingForm.displayName = "StepInjectingForm"

export default StepInjectingForm
