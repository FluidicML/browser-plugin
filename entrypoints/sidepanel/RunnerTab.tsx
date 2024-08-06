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
import StepResultCard from "./runner_tab/StepResultCard"

// State shared across all steps/tasks. Treat instances of this class as
// immutable.
class Context {
  private readonly _browserTab: number
  private readonly _stepIndex: number
  private readonly _taskIndex: number

  readonly workflow: Workflow
  readonly results: StepResult[]

  private _params: Map<string, string> | null

  constructor(values: {
    browserTab: number
    stepIndex: number
    taskIndex: number
    workflow: Workflow
    results: StepResult[]
  }) {
    this._browserTab = values.browserTab
    this._stepIndex = values.stepIndex
    this._taskIndex = values.taskIndex
    this.workflow = values.workflow
    this.results = values.results
    this._params = null
  }

  get tabId() {
    return this._browserTab
  }

  get stepIndex() {
    return this._stepIndex
  }

  get taskIndex() {
    return this._taskIndex
  }

  get lastStep() {
    return this.results[this.results.length - 1]
  }

  get isFinished() {
    return this.stepIndex >= this.workflow.actions.length
  }

  get params() {
    if (this._params === null) {
      const params = new Map()
      this.results.forEach((result) => {
        for (const [key, val] of result.params.entries()) {
          params.set(key, val)
        }
      })
      this._params = params
    }
    return this._params
  }

  increment(): [number, number] {
    const action = this.workflow.actions[this.stepIndex]
    const kind = action.kind

    switch (kind) {
      case ActionKind.EXTRACTING: {
        if (this.taskIndex >= action.values.params.length - 1) {
          return [this._stepIndex + 1, 0]
        }
        return [this._stepIndex, this._taskIndex + 1]
      }
      case ActionKind.RECORDING: {
        if (this.taskIndex >= action.values.recordings.length - 1) {
          return [this._stepIndex + 1, 0]
        }
        return [this._stepIndex, this._taskIndex + 1]
      }
      case ActionKind.NAVIGATE: {
        return [this._stepIndex + 1, 0]
      }
      case ActionKind.OPENAI: {
        return [this._stepIndex + 1, 0]
      }
      default: {
        const _exhaustivenessCheck = kind // never
        return [0, 0]
      }
    }
  }
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
  return await sendTab<ReplayExtractingClickMessage>(context.tabId, {
    event: Event.REPLAY_EXTRACTING_CLICK,
    payload: {
      name: values.params[context.taskIndex].name,
      selector: values.params[context.taskIndex].selector,
    },
  })
}

const replayRecordingTask = async (
  context: Context,
  recording: ActionRecordingSchema["recordings"][number]
): Promise<TaskResult> => {
  const action = recording.action

  let result: TaskResult
  switch (action) {
    case "click": {
      result = await sendTab<ReplayRecordingClickMessage>(context.tabId, {
        event: Event.REPLAY_RECORDING_CLICK,
        payload: { selector: recording.selector },
      })
      break
    }
    case "keyup": {
      result = await sendTab<ReplayRecordingKeyupMessage>(context.tabId, {
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
  const recording = values.recordings[context.taskIndex]

  let result: TaskResult
  try {
    result = await replayRecordingTask(context, recording)
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
    await waitForTab(context.tabId)
    result = await replayRecordingTask(context, recording)
  }

  if (result.status === "FAILURE" && recording.fallible) {
    result.status = "SKIPPED"
  }

  return result
}

const runNavigateTask = async (
  context: Context,
  values: ActionNavigateSchema
): Promise<TaskResult> => {
  const interpolated = interpolate(values.url, context.params)
  await updateTab(context.tabId, { url: interpolated })
  return { status: "SUCCESS" }
}

const runOpenAITask = async (
  context: Context,
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

    return {
      status: "SUCCESS",
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
  openaiApiKey: string
): Promise<TaskResult> => {
  const action = context.workflow.actions[context.stepIndex]
  const kind = action.kind

  let result: TaskResult
  switch (kind) {
    case ActionKind.EXTRACTING: {
      result = await runExtractingTask(context, action.values)
      break
    }
    case ActionKind.RECORDING: {
      result = await runRecordingTask(context, action.values)
      break
    }
    case ActionKind.NAVIGATE: {
      result = await runNavigateTask(context, action.values)
      break
    }
    case ActionKind.OPENAI: {
      result = await runOpenAITask(context, action.values, openaiApiKey)
      break
    }
    default: {
      result = kind // never
      break
    }
  }

  return result
}

// TODO: Should handle when the active tab is shutdown.

const RunnerTab = () => {
  const store = useSharedStore()
  const [context, setContext] = React.useState<Context | null>(null)

  // Changes to our triggered workflow indicate either starting a workflow or
  // potentially deleting an active one.
  React.useEffect(() => {
    const workflow = store.triggered
    if (workflow === null) {
      setContext(null)
      return
    }
    const defaultValues = {
      workflow,
      browserTab: 0,
      stepIndex: 0,
      taskIndex: 0,
      results: [new StepResult({ tasks: [] })],
    }
    setContext(new Context(defaultValues))
    queryTabs({ active: true, currentWindow: true }).then((tabs) => {
      setContext(new Context({ ...defaultValues, browserTab: tabs[0].id! }))
    })
  }, [store.triggered, setContext])

  // Process each step/task of the workflow. On completion, trigger an update
  // to reinvoke this same effect.
  React.useEffect(() => {
    if (
      context === null ||
      context.tabId === 0 ||
      context.lastStep?.status === "FAILURE" ||
      context.isFinished
    ) {
      return
    }
    runTask(context, store.openaiApiKey).then((result) => {
      setContext((prev) => {
        if (!prev) {
          throw new Error("Context not set during run.")
        }

        const results = [...prev.results]
        results[prev.stepIndex] = new StepResult({
          tasks: [...(results[prev.stepIndex]?.tasks ?? []), result],
        })

        const [stepIndex, taskIndex] = prev.increment()
        if (!results[stepIndex] && stepIndex < prev.workflow.actions.length) {
          results[stepIndex] = new StepResult({ tasks: [] })
        }

        return new Context({
          workflow: prev.workflow,
          browserTab: prev.tabId,
          stepIndex,
          taskIndex,
          results,
        })
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
          {context.lastStep?.status === "FAILURE" ? (
            <CloseIcon className="w-5 h-5 rounded-full fill-red-700" />
          ) : context.isFinished ? (
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

      {context.results.map((result, index) => {
        const title = `Step ${index + 1} / ${context.workflow.actions.length}`
        const action = context.workflow.actions[index]
        const desc = `${action.kind.slice(0, 1).toUpperCase() + action.kind.slice(1)}`
        return (
          <StepResultCard
            key={`${context.workflow.uuid}-${index}`}
            title={title}
            description={desc}
            action={action}
            result={result}
          />
        )
      })}
    </div>
  )
}
RunnerTab.displayName = "RunnerTab"

export default RunnerTab
