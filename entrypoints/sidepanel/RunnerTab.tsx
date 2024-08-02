import React from "react"

import type {
  ReplayExtractingClickMessage,
  ReplayRecordingClickMessage,
  ReplayRecordingKeyupMessage,
} from "@/utils/messages"
import { chatCompletion } from "@/utils/openai"
import { mergeStepResults } from "@/utils/workflow"
import CheckmarkIcon from "@/components/icons/Checkmark"
import CloseIcon from "@/components/icons/Close"
import FolderIcon from "@/components/icons/Folder"
import LoadingIcon from "@/components/icons/Loading"
import { Separator } from "@/components/ui/separator"
import { Card, CardTitle } from "@/components/ui/card"
import { MessageEvent, sendTab } from "@/utils/messages"
import { useSharedStore } from "./store"
import { waitForTab, updateTab, queryTabs } from "@/utils/browser_tabs"
import StepCard from "./runner_tab/StepCard"

type Context = {
  workflow: Workflow
  browserTab: number
  actionIndex: number
  results: StepResult[]
  params: Map<string, string>
}

const interpolate = (value: string, params: Map<string, string>): string => {
  let interpolated = value
  for (const [key, val] of params.entries()) {
    const re = new RegExp(`{${key}}`, "g")
    interpolated = interpolated.replace(re, val)
  }
  return interpolated
}

const runExtractingStep = async (
  context: Context,
  values: ActionExtractingSchema
): Promise<StepResult> => {
  let result: StepResult = { success: true }

  for (const param of values.params) {
    const next = await sendTab<ReplayExtractingClickMessage>(
      context.browserTab,
      {
        event: MessageEvent.REPLAY_EXTRACTING_CLICK,
        payload: { name: param.name, selector: param.selector },
      }
    )

    result = mergeStepResults(result, next)
    if (!result.success) {
      return result
    }
  }

  return result
}

const replayRecording = async (
  context: Context,
  recording: ActionRecordingSchema["recordings"][number]
): Promise<StepResult> => {
  let next: StepResult
  const action = recording.action

  switch (action) {
    case "click": {
      next = await sendTab<ReplayRecordingClickMessage>(context.browserTab, {
        event: MessageEvent.REPLAY_RECORDING_CLICK,
        payload: { selector: recording.selector },
      })
      break
    }
    case "keyup": {
      next = await sendTab<ReplayRecordingKeyupMessage>(context.browserTab, {
        event: MessageEvent.REPLAY_RECORDING_KEYUP,
        payload: { selector: recording.selector, value: recording.value },
      })
      break
    }
    default: {
      next = action // never
      break
    }
  }

  return next
}

const runRecordingStep = async (
  context: Context,
  values: ActionRecordingSchema
): Promise<StepResult> => {
  let result: StepResult = { success: true }

  for (const recording of values.recordings) {
    let next: StepResult

    try {
      next = await replayRecording(context, recording)
    } catch (e) {
      // We may end up failing if the last action we invoked loaded a new page.
      // In these cases, we just need to wait for the page to reload. Try again
      // once that finishes.
      //
      // WXT's error handling isn't particularly useful. Though we could
      // hardcode the type of error on the message, this is prone to silently
      // breaking on any updates. Instead, just assume we can recover by
      // retrying.
      //
      // TODO: This error handling needs to be expanded on once we're ready to
      // take on multi-tab flows.
      await waitForTab(context.browserTab)
      next = await replayRecording(context, recording)
    }

    result = mergeStepResults(result, next)
    if (!result.success) {
      return result
    }
  }

  return result
}

const runNavigateStep = async (
  context: Context,
  values: ActionNavigateSchema
): Promise<StepResult> => {
  await updateTab(context.browserTab, {
    url: interpolate(values.url, context.params),
  })
  return { success: true }
}

const runOpenAIStep = async (
  context: Context,
  values: ActionOpenAISchema,
  openaiApiKey: string
): Promise<StepResult> => {
  if (!openaiApiKey) {
    return { success: false, messages: ["Invalid OpenAI API key."] }
  }

  const props: { [key: string]: { type: string; description: string } } = {}
  for (const param of values.params) {
    props[param.name] = {
      type: "string",
      description: param.description,
    }
  }

  try {
    const response = await chatCompletion({
      openaiApiKey,
      systemPrompt: `
        ${interpolate(values.system, context.params)}

        # FORMATTING
        Output responses in JSON.
      `,
      userPrompt: interpolate(values.user, context.params),
      tools: [
        {
          type: "function",
          function: {
            name: "fluidic_function",
            parameters: {
              type: "object",
              properties: props,
            },
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: {
          name: "fluidic_function",
        },
      },
      response_format: { type: "json_object" },
    })

    const params = new Map()
    const messages = []

    for (const [key, val] of Object.entries(
      JSON.parse(
        response.data.choices?.[0]?.message?.tool_calls?.[0]?.function
          ?.arguments
      )
    )) {
      params.set(key, val)
      messages.push(`Received value for {${key}}.`)
    }

    return { success: true, messages, params: [...params] }
  } catch (e) {
    console.error(e)
    return { success: false, messages: ["Invalid OpenAI response."] }
  }
}

const runStep = async (
  context: Context,
  openaiApiKey: string
): Promise<StepResult> => {
  const action = context.workflow.actions[context.actionIndex]
  const kind = action.kind

  switch (kind) {
    case ActionKind.EXTRACTING: {
      return await runExtractingStep(context, action.values)
    }
    case ActionKind.RECORDING: {
      return await runRecordingStep(context, action.values)
    }
    case ActionKind.NAVIGATE: {
      return await runNavigateStep(context, action.values)
    }
    case ActionKind.OPENAI: {
      return await runOpenAIStep(context, action.values, openaiApiKey)
    }
    default: {
      const _exhaustivenessCheck: never = kind
      break
    }
  }

  return { success: false, messages: [`Unsupported ${kind} action.`] }
}

const RunnerTab = () => {
  const store = useSharedStore()

  // TODO: Should handle when the active tab is shutdown.
  const [context, setContext] = React.useState<Context | null>(null)

  // Changes to our triggered workflow indicate either starting a workflow or
  // potentially deleting an active one.
  React.useEffect(() => {
    const workflow = store.triggered
    if (workflow === null) {
      setContext(null)
      return
    }
    const defaultValues: Context = {
      workflow,
      browserTab: 0,
      actionIndex: 0,
      results: [],
      params: new Map(),
    }
    setContext(defaultValues)
    queryTabs({ active: true, currentWindow: true }).then((tabs) => {
      setContext({ ...defaultValues, browserTab: tabs[0].id!, actionIndex: 0 })
    })
  }, [store.triggered, setContext])

  // Process each step of the workflow. On completion, trigger an update to
  // reinvoke this same effect.
  React.useEffect(() => {
    if (
      context === null ||
      context.browserTab === 0 ||
      context.actionIndex >= context.workflow.actions.length ||
      context.results[context.actionIndex]?.success === false
    ) {
      return
    }
    runStep(context, store.openaiApiKey).then((result) => {
      setContext({
        ...context,
        actionIndex: result.success
          ? context.actionIndex + 1
          : context.actionIndex,
        results: [...context.results, result],
        params: new Map([...context.params, ...(result.params ?? [])]),
      })
    })
  }, [context, store.openaiApiKey])

  if (context === null) {
    return (
      <div className="flex flex-col items-center gap-2 p-4">
        <FolderIcon className="w-10 h-10 fill-black dark:fill-white" />
        <p className="pt-2 text-center text-base">No running workflow.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <CardTitle className="pt-2 flex items-center gap-2">
          {context.results[context.actionIndex]?.success === false ? (
            <CloseIcon className="w-5 h-5 rounded-full fill-red-900" />
          ) : context.actionIndex === context.workflow.actions.length ? (
            <CheckmarkIcon className="w-5 h-5 rounded-full fill-emerald-600" />
          ) : (
            <LoadingIcon className="w-5 h-5 fill-emerald-600" />
          )}
          {context.workflow.init.name}{" "}
          <span className="text-xs text-muted-foreground ml-auto">
            ({context.workflow.uuid.slice(0, 8)})
          </span>
        </CardTitle>
      </Card>

      <Separator />

      {[...Array(context.actionIndex + 1).keys()].map((index) => {
        if (index === context.workflow.actions.length) {
          return null
        }

        const actions = context.workflow.actions
        const kind = actions[index].kind
        const title = `Step ${index + 1} / ${actions.length}`
        const subtitle = `${kind.slice(0, 1).toUpperCase() + kind.slice(1)}`

        return (
          <StepCard
            key={`${context.workflow.uuid}-${index}`}
            action={actions[index]}
            title={title}
            subtitle={subtitle}
            isRunning={index === context.actionIndex}
            result={context.results[index] ?? null}
          />
        )
      })}
    </div>
  )
}
RunnerTab.displayName = "RunnerTab"

export default RunnerTab
