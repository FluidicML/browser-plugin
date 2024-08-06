import React from "react"

import type {
  ReplayExtractingClickMessage,
  ReplayRecordingClickMessage,
  ReplayRecordingKeyupMessage,
} from "@/utils/messages"
import { chatCompletion } from "@/utils/openai"
import { StepResult, type TaskResult } from "@/utils/workflow"
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

const runExtractingTask = async (
  context: Context,
  values: ActionExtractingSchema
): Promise<TaskResult> => {
  return await sendTab<ReplayExtractingClickMessage>(context.browserTab, {
    event: Event.REPLAY_EXTRACTING_CLICK,
    payload: {
      name: values.params[context.index.task].name,
      selector: values.params[context.index.task].selector,
    },
  })
}

const replayRecordingTask = async (
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

const runRecordingTask = async (
  context: Context,
  values: ActionRecordingSchema
): Promise<TaskResult> => {
  let task: TaskResult
  const recording = values.recordings[context.index.task]

  try {
    task = await replayRecordingTask(context, recording)
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
    task = await replayRecordingTask(context, recording)
  }

  if (task.status === "FAILURE" && recording.fallible) {
    task.status = "SKIPPED"
  }

  return task
}

const runNavigateTask = async (
  context: Context,
  params: Map<string, string>,
  values: ActionNavigateSchema
): Promise<TaskResult> => {
  const interpolated = interpolate(values.url, params)
  await updateTab(context.browserTab, { url: interpolated })
  return { status: "SUCCESS", message: `Navigated to ${interpolated}.` }
}

const runOpenAITask = async (
  params: Map<string, string>,
  values: ActionOpenAISchema,
  openaiApiKey: string
): Promise<TaskResult> => {
  if (!openaiApiKey) {
    return { status: "FAILURE", message: "Invalid OpenAI API Key." }
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
        ${interpolate(values.system, params)}

        # FORMATTING
        Output responses in JSON.
      `,
      userPrompt: interpolate(values.user, params),
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

    return {
      status: "SUCCESS",
      message: "Received response from OpenAI.",
      params: [
        ...Object.entries(
          JSON.parse(
            response.data.choices?.[0]?.message?.tool_calls?.[0]?.function
              ?.arguments
          )
        ),
      ] as [string, string][],
    }
  } catch (e) {
    console.error(e)
    return { status: "FAILURE", message: "Invalid OpenAI response." }
  }
}

const runTask = async (
  context: Context,
  params: Map<string, string>,
  openaiApiKey: string
): Promise<TaskResult> => {
  const action = context.workflow.actions[context.index.step]
  const kind = action.kind

  let taskResult: TaskResult
  switch (kind) {
    case ActionKind.EXTRACTING: {
      taskResult = await runExtractingTask(context, action.values)
      break
    }
    case ActionKind.RECORDING: {
      taskResult = await runRecordingTask(context, action.values)
      break
    }
    case ActionKind.NAVIGATE: {
      taskResult = await runNavigateTask(context, params, action.values)
      break
    }
    case ActionKind.OPENAI: {
      taskResult = await runOpenAITask(params, action.values, openaiApiKey)
      break
    }
    default: {
      taskResult = kind // never
      break
    }
  }

  return taskResult
}

const RunnerTab = () => {
  const store = useSharedStore()

  // TODO: Should handle when the active tab is shutdown.

  const [context, setContext] = React.useState<Context | null>(null)
  const contextLatestStep = context?.results[context.results.length - 1]
  const contextFinished = context
    ? context.index.step >= context.workflow.actions.length
    : false
  const contextParams = React.useMemo(() => {
    const params = new Map()
    context?.results.forEach((result) =>
      result.params.forEach(([key, val]) => params.set(key, val))
    )
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
    }
    setContext(defaultValues)
    queryTabs({ active: true, currentWindow: true }).then((tabs) => {
      setContext({ ...defaultValues, browserTab: tabs[0].id! })
    })
  }, [store.triggered, setContext])

  // Process each step/task of the workflow. On completion, trigger an update
  // to reinvoke this same effect.
  React.useEffect(() => {
    if (
      context === null ||
      context.browserTab === 0 ||
      contextLatestStep?.status === "FAILURE" ||
      contextFinished
    ) {
      return
    }
    runTask(context, contextParams, store.openaiApiKey).then((result) => {
      setContext((prev) => {
        if (!prev) {
          throw new Error("Context not set during run.")
        }

        const results = [...prev.results]
        results[prev.index.step] = new StepResult({
          tasks: [...(results[prev.index.step]?.tasks ?? []), result],
        })

        // Decide if we should update our task index or update our step index.
        let stepIndex = prev.index.step
        let taskIndex = prev.index.task
        const action = prev.workflow.actions[prev.index.step]
        const kind = action.kind

        switch (kind) {
          case ActionKind.EXTRACTING: {
            if (taskIndex >= action.values.params.length - 1) {
              stepIndex += 1
              taskIndex = 0
            } else {
              taskIndex += 1
            }
            break
          }
          case ActionKind.RECORDING: {
            if (taskIndex >= action.values.recordings.length - 1) {
              stepIndex += 1
              taskIndex = 0
            } else {
              taskIndex += 1
            }
            break
          }
          case ActionKind.NAVIGATE: {
            stepIndex += 1
            taskIndex = 0
            break
          }
          case ActionKind.OPENAI: {
            stepIndex += 1
            taskIndex = 0
            break
          }
          default: {
            stepIndex = kind // never
            break
          }
        }

        return {
          ...prev,
          index: { step: stepIndex, task: taskIndex },
          results,
        }
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
          ) : contextFinished ? (
            <CheckmarkIcon className="w-5 h-5 rounded-full fill-emerald-600" />
          ) : (
            <LoadingIcon className="w-5 h-5 fill-emerald-600" />
          )}
          {context.workflow.init.name}{" "}
          <span className="text-xs text-muted-foreground ml-auto">
            ({context.workflow.uuid.slice(0, 8)})
          </span>
        </CardTitle>
        {contextParams.size > 0 && (
          <CardContent className="overflow-x-auto scrollbar">
            <Separator className="my-4" />
            <table className="table-auto">
              <tbody>
                {[...contextParams.entries()].map(([key, val]) => (
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

      {context.workflow.actions.map((action, index) => {
        const title = `Step ${index + 1} / ${context.workflow.actions.length}`
        const description = `${action.kind.slice(0, 1).toUpperCase() + action.kind.slice(1)}`

        if (index > context.index.step) {
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
