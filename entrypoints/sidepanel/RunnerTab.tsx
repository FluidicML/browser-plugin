import React from "react"

import type {
  ReplayExtractingClickMessage,
  ReplayRecordingClickMessage,
  ReplayRecordingKeyupMessage,
} from "@/utils/messages"
import { chatCompletion } from "@/utils/openai"
import { StepResult } from "@/utils/workflow"
import CheckmarkIcon from "@/components/icons/Checkmark"
import CloseIcon from "@/components/icons/Close"
import FolderIcon from "@/components/icons/Folder"
import LoadingIcon from "@/components/icons/Loading"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Event, sendTab } from "@/utils/messages"
import { useSharedStore } from "./store"
import { waitForTab, updateTab, queryTabs } from "@/utils/browser_tabs"
import StepCard from "./runner_tab/StepCard"

type Context = {
  workflow: Workflow
  browserTab: number
  index: { step: number; task: number }
  results: StepResult[]
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
  const result = new StepResult()

  for (const param of values.params) {
    const task = await sendTab<ReplayExtractingClickMessage>(
      context.browserTab,
      {
        event: Event.REPLAY_EXTRACTING_CLICK,
        payload: { name: param.name, selector: param.selector },
      }
    )

    result.pushTaskResult(task)
    if (result.status === "FAILURE") {
      return result
    }
  }

  return result
}

const runRecordingTask = async (
  context: Context,
  recording: ActionRecordingSchema["recordings"][number]
): Promise<TaskResult> => {
  let result: TaskResult
  const action = recording.action

  switch (action) {
    case "click": {
      result = await sendTab<ReplayRecordingClickMessage>(context.browserTab, {
        event: Event.REPLAY_RECORDING_CLICK,
        payload: { selector: recording.selector },
      })
      break
    }
    case "keyup": {
      result = await sendTab<ReplayRecordingKeyupMessage>(context.browserTab, {
        event: Event.REPLAY_RECORDING_KEYUP,
        payload: { selector: recording.selector, value: recording.value },
      })
      break
    }
    default: {
      result = action // never
      break
    }
  }

  return result
}

const runRecordingStep = async (
  context: Context,
  values: ActionRecordingSchema
): Promise<StepResult> => {
  const result = new StepResult()

  for (const recording of values.recordings) {
    let task: TaskResult

    try {
      task = await runRecordingTask(context, recording)
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
      task = await runRecordingTask(context, recording)
    }

    if (task.status === "FAILURE" && recording.fallible) {
      task.status = "SKIPPED"
    }

    result.pushTaskResult(task)
    if (result.status === "FAILURE") {
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
  return new StepResult()
}

const runOpenAIStep = async (
  context: Context,
  values: ActionOpenAISchema,
  openaiApiKey: string
): Promise<StepResult> => {
  if (!openaiApiKey) {
    return new StepResult({
      tasks: [
        {
          status: "FAILURE",
          message: "Invalid OpenAI API Key.",
        },
      ],
    })
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

    const tasks: TaskResult[] = []
    for (const [key, val] of Object.entries(
      JSON.parse(
        response.data.choices?.[0]?.message?.tool_calls?.[0]?.function
          ?.arguments
      )
    )) {
      tasks.push({
        status: "SUCCESS",
        params: [[key, val as string]],
        message: `Received value for {${key}}.`,
      })
    }
    return new StepResult({ tasks })
  } catch (e) {
    console.error(e)
    return new StepResult({
      tasks: [
        {
          status: "FAILURE",
          message: "Invalid OpenAI response.",
        },
      ],
    })
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

  return new StepResult({
    tasks: [
      {
        status: "FAILURE",
        message: `Unsupported ${kind} action.`,
      },
    ],
  })
}

const RunnerTab = () => {
  const store = useSharedStore()

  // TODO: Should handle when the active tab is shutdown.

  const [context, setContext] = React.useState<Context | null>(null)
  const contextLatestStep = context?.results[context.results.length - 1]
  const contextWorkflowFinished = context
    ? context.index.step >= context.workflow.actions.length
    : false

  const contextParams = React.useMemo(() => {
    const params = new Map()
    if (context?.results) {
      for (const result of context.results) {
        for (const [key, val] of result.params) {
          params.set(key, val)
        }
      }
    }
    return params
  }, [context?.results])

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
      index: { step: 0, task: 0 },
      results: [],
      params: new Map(),
    }
    setContext(defaultValues)
    queryTabs({ active: true, currentWindow: true }).then((tabs) => {
      setContext({ ...defaultValues, browserTab: tabs[0].id! })
    })
  }, [store.triggered, setContext])

  // Process each step of the workflow. On completion, trigger an update to
  // reinvoke this same effect.
  React.useEffect(() => {
    if (
      context === null ||
      context.browserTab === 0 ||
      contextLatestStep?.status === "FAILURE" ||
      contextWorkflowFinished
    ) {
      return
    }
    runStep(context, store.openaiApiKey).then((result) => {
      setContext({
        ...context,
        actionIndex:
          result.status === "SUCCESS"
            ? context.actionIndex + 1
            : context.actionIndex,
        results: [...context.results, result],
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
          {contextLatestStep?.status === "FAILURE" ? (
            <CloseIcon className="w-5 h-5 rounded-full fill-red-700" />
          ) : contextWorkflowFinished ? (
            <CheckmarkIcon className="w-5 h-5 rounded-full fill-emerald-600" />
          ) : (
            <LoadingIcon className="w-5 h-5 fill-emerald-600" />
          )}
          {context.workflow.init.name}{" "}
          <span className="text-xs text-muted-foreground ml-auto">
            ({context.workflow.uuid.slice(0, 8)})
          </span>
        </CardTitle>
        {context.params.size > 0 && (
          <CardContent className="overflow-x-auto scrollbar">
            <Separator className="my-4" />
            <table className="table-auto">
              <tbody>
                {[...context.params.entries()].map(([key, val]) => (
                  <tr key={key}>
                    <td className="text-right">
                      <pre className="font-bold pr-1">{key}:</pre>
                    </td>
                    <td>
                      <pre>{val}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        )}
      </Card>

      <Separator />

      {context.workflow.steps.map((action, index) => {
        const title = `Step ${index + 1} / ${context.workflow.steps.length}`
        const description = `${action.kind.slice(0, 1).toUpperCase() + action.kind.slice(1)}`

        if (index > context.actionIndex) {
          return null
        }

        return (
          <StepCard
            key={`${context.workflow.uuid}-${index}`}
            title={title}
            description={description}
            action={action}
            result={context.results[index] ?? null}
          />
        )
      })}
    </div>
  )
}
RunnerTab.displayName = "RunnerTab"

export default RunnerTab
