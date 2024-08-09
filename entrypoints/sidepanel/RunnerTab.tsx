import React from "react"

import type {
  ReplayExtractingClickMessage,
  ReplayInjectingMessage,
  ReplayRecordingClickMessage,
  ReplayRecordingKeyupMessage,
} from "@/utils/messages"
import { chatCompletion } from "@/utils/openai"
import { type TaskResult } from "@/utils/workflow"
import CheckmarkIcon from "@/components/icons/Checkmark"
import CloseIcon from "@/components/icons/Close"
import FolderIcon from "@/components/icons/Folder"
import LoadingIcon from "@/components/icons/Loading"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Event, sendTab } from "@/utils/messages"
import { useSharedStore } from "./store"
import { waitForTab, updateTab } from "@/utils/browser_tabs"
import StepResultCard from "./runner_tab/StepResultCard"

type Context = {
  workflow: Workflow
  tabId: number
  stepIndex: number
  taskIndex: number
  params: Map<string, string>
  openAIKey: string
  replayTimeoutMillis: number
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
  values: StepExtractingSchema
): Promise<TaskResult> => {
  return await sendTab<ReplayExtractingClickMessage>(context.tabId, {
    event: Event.REPLAY_EXTRACTING_CLICK,
    payload: {
      name: values.params[context.taskIndex].name,
      selector: values.params[context.taskIndex].selector,
      timeoutMillis: context.replayTimeoutMillis,
    },
  })
}

const runInjectingTask = async (
  context: Context,
  values: StepInjectingSchema
): Promise<TaskResult> => {
  return await sendTab<ReplayInjectingMessage>(context.tabId, {
    event: Event.REPLAY_INJECTING,
    payload: {
      name: values.targets[context.taskIndex].name,
      selector: values.targets[context.taskIndex].selector,
      value: context.params.get(values.targets[context.taskIndex].name) ?? "",
      timeoutMillis: context.replayTimeoutMillis,
    },
  })
}

const runNavigateTask = async (
  context: Context,
  values: StepNavigateSchema
): Promise<TaskResult> => {
  const interpolated = interpolate(values.url, context.params)
  await updateTab(context.tabId, { url: interpolated })
  return { status: TaskStatus.SUCCEEDED }
}

const runOpenAITask = async (
  context: Context,
  values: StepOpenAISchema
): Promise<TaskResult> => {
  if (!context.openAIKey) {
    return { status: TaskStatus.FAILED, message: "Invalid OpenAI API Key." }
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
      openAIKey: context.openAIKey,
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
      status: TaskStatus.SUCCEEDED,
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
    return { status: TaskStatus.FAILED, message: "Invalid OpenAI response." }
  }
}

const replayRecordingTask = async (
  context: Context,
  recording: StepRecordingSchema["recordings"][number]
): Promise<TaskResult> => {
  const action = recording.action

  let result: TaskResult
  switch (action) {
    case "click": {
      result = await sendTab<ReplayRecordingClickMessage>(context.tabId, {
        event: Event.REPLAY_RECORDING_CLICK,
        payload: {
          selector: recording.selector,
          timeoutMillis: context.replayTimeoutMillis,
        },
      })
      break
    }
    case "keyup": {
      result = await sendTab<ReplayRecordingKeyupMessage>(context.tabId, {
        event: Event.REPLAY_RECORDING_KEYUP,
        payload: {
          selector: recording.selector,
          value: recording.value,
          timeoutMillis: context.replayTimeoutMillis,
        },
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
  values: StepRecordingSchema
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

  if (result.status === TaskStatus.FAILED && recording.fallible) {
    result.status = TaskStatus.SKIPPED
  }

  return result
}

const runTask = async (context: Context): Promise<TaskResult> => {
  const step = context.workflow.steps[context.stepIndex]
  const kind = step.kind

  let result: TaskResult
  switch (kind) {
    case StepKind.EXTRACTING: {
      result = await runExtractingTask(context, step.values)
      break
    }
    case StepKind.INJECTING: {
      result = await runInjectingTask(context, step.values)
      break
    }
    case StepKind.NAVIGATE: {
      result = await runNavigateTask(context, step.values)
      break
    }
    case StepKind.OPENAI: {
      result = await runOpenAITask(context, step.values)
      break
    }
    case StepKind.PROMPT: {
      result = { status: TaskStatus.PAUSED }
      break
    }
    case StepKind.RECORDING: {
      result = await runRecordingTask(context, step.values)
      break
    }
    default: {
      result = kind // never
      break
    }
  }

  return result
}

const RunnerTab = () => {
  const sharedStore = useSharedStore()
  const runnerParams = React.useMemo(() => {
    return sharedStore.runnerActions.getParams()
  }, [sharedStore.runnerStepIndex, sharedStore.runnerTaskIndex])

  // Process each step/task of the workflow. On completion, trigger an update
  // to reinvoke this same effect.
  React.useEffect(() => {
    const workflow = sharedStore.runnerActive
    const tabId = sharedStore.runnerTabId

    if (
      workflow === null ||
      tabId === null ||
      sharedStore.runnerActions.isFinished() ||
      sharedStore.runnerActions.getStatus() === StepStatus.PAUSED
    ) {
      return
    }

    runTask({
      workflow,
      tabId,
      stepIndex: sharedStore.runnerStepIndex,
      taskIndex: sharedStore.runnerTaskIndex,
      params: runnerParams,
      openAIKey: sharedStore.settingsOpenAIKey,
      replayTimeoutMillis: sharedStore.settingsReplayTimeoutSecs * 1000,
    }).then((result) => {
      sharedStore.runnerActions.pushTaskResult(result)
    })
  }, [
    runnerParams,
    sharedStore.runnerActive,
    sharedStore.runnerTabId,
    sharedStore.runnerStepIndex,
    sharedStore.runnerTaskIndex,
    sharedStore.runnerActions,
    sharedStore.settingsOpenAIKey,
    sharedStore.settingsReplayTimeoutSecs,
  ])

  if (sharedStore.runnerActive === null) {
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
          {sharedStore.runnerActions.getStatus() === StepStatus.FAILED ? (
            <CloseIcon className="w-5 h-5 rounded-full fill-red-700" />
          ) : sharedStore.runnerActions.isFinished() ? (
            <CheckmarkIcon className="w-5 h-5 rounded-full fill-emerald-600" />
          ) : (
            <LoadingIcon className="w-5 h-5 fill-emerald-600" />
          )}
          {sharedStore.runnerActive.init.name}{" "}
          <span className="text-xs text-muted-foreground ml-auto">
            ({sharedStore.runnerActive.uuid.slice(0, 8)})
          </span>
        </CardTitle>

        {runnerParams.size > 0 && (
          <CardContent className="overflow-x-auto scrollbar">
            <Separator className="my-4" />
            <table className="table-auto muted min-w-full">
              <tbody>
                {[...runnerParams.entries()].map(([key, val]) => (
                  <tr key={key} className="[&:not(:last-child)]:border-b muted">
                    <td className="align-top">
                      <pre className="font-bold py-1 pr-1">{key}:</pre>
                    </td>
                    <td className="align-top">
                      <pre className="py-1">{val}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        )}
      </Card>

      <Separator />

      {[...Array(sharedStore.runnerStepIndex + 1).keys()].map((index) => {
        const workflow = sharedStore.runnerActive
        if (workflow === null || index >= workflow.steps.length) {
          return null
        }

        const title = `Step ${index + 1} / ${workflow.steps.length}`
        const step = workflow.steps[index]
        const desc = `${step.kind.slice(0, 1).toUpperCase() + step.kind.slice(1)}`

        return (
          <StepResultCard
            key={`${workflow.uuid}-${index}`}
            title={title}
            description={desc}
            step={step}
            result={sharedStore.runnerResults[index] ?? null}
          />
        )
      })}
    </div>
  )
}
RunnerTab.displayName = "RunnerTab"

export default RunnerTab
