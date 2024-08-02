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
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { MessageEvent, sendTab } from "@/utils/messages"
import { useSharedStore } from "./store"
import {
  updateTabUntilComplete,
  queryTabsUntilComplete,
} from "@/utils/browser_tabs"
import StepCard from "./runner_tab/StepCard"

const runExtractingStep = async (
  browserTab: number,
  values: ActionExtractingSchema
): Promise<StepResult> => {
  let result: StepResult = { success: true }

  for (const param of values.params) {
    const next = await sendTab<ReplayExtractingClickMessage>(browserTab, {
      event: MessageEvent.REPLAY_EXTRACTING_CLICK,
      payload: { name: param.name, selector: param.selector },
    })

    result = mergeStepResults(result, next)
    if (!result.success) {
      return result
    }
  }

  return result
}

const runRecordingStep = async (
  browserTab: number,
  values: ActionRecordingSchema
): Promise<StepResult> => {
  let result: StepResult = { success: true }

  for (const recording of values.recordings) {
    let next: StepResult
    const action = recording.action

    switch (action) {
      case "click": {
        next = await sendTab<ReplayRecordingClickMessage>(browserTab, {
          event: MessageEvent.REPLAY_RECORDING_CLICK,
          payload: { selector: recording.selector },
        })
        break
      }
      case "keyup": {
        next = await sendTab<ReplayRecordingKeyupMessage>(browserTab, {
          event: MessageEvent.REPLAY_RECORDING_KEYUP,
          payload: { selector: recording.selector, value: recording.value },
        })
        break
      }
      default: {
        next = action
        break
      }
    }

    result = mergeStepResults(result, next)
    if (!result.success) {
      return result
    }
  }

  return result
}

const runNavigateStep = async (
  browserTab: number,
  url: string
): Promise<StepResult> => {
  await updateTabUntilComplete(browserTab, { url })
  return { success: true }
}

const runOpenAIStep = async (
  openaiApiKey: string,
  systemPrompt: string,
  userPrompt: string,
  params: { name: string; description: string }[]
): Promise<StepResult> => {
  if (!openaiApiKey) {
    return { success: false, messages: ["Invalid OpenAI API key."] }
  }

  const props: { [key: string]: { type: string; description: string } } = {}
  for (const param of params) {
    props[param.name] = {
      type: "string",
      description: param.description,
    }
  }

  try {
    const response = await chatCompletion({
      openaiApiKey,
      systemPrompt: `${systemPrompt}\n\n# FORMATTING\nOutput responses in JSON.`,
      userPrompt,
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

    const args = new Map()
    const messages = []

    for (const [key, val] of Object.entries(
      JSON.parse(
        response.data.choices?.[0]?.message?.tool_calls?.[0]?.function
          ?.arguments
      )
    )) {
      args.set(key, val)
      messages.push(`Received value for {${key}}.`)
    }

    return { success: true, messages, args }
  } catch (e) {
    console.error(e)
    return { success: false, messages: ["Invalid OpenAI response."] }
  }
}

const runStep = async (
  browserTab: number,
  action: ActionForm,
  openaiApiKey: string
): Promise<StepResult> => {
  const kind = action.kind

  switch (kind) {
    case ActionKind.EXTRACTING: {
      return await runExtractingStep(browserTab, action.values)
    }
    case ActionKind.RECORDING: {
      return await runRecordingStep(browserTab, action.values)
    }
    case ActionKind.NAVIGATE: {
      return await runNavigateStep(browserTab, action.values.url)
    }
    case ActionKind.OPENAI: {
      return await runOpenAIStep(
        openaiApiKey,
        action.values.system,
        action.values.user,
        action.values.params
      )
    }
    default: {
      const _exhaustivenessCheck: never = kind
      break
    }
  }

  return { success: false, messages: [`Unsupported ${kind} action.`] }
}

type Running = {
  workflow: Workflow
  browserTab: number
  actionIndex: number
  results: StepResult[]
}

const RunnerTab = () => {
  const store = useSharedStore()

  // TODO: Should handle when the active tab is shutdown.
  const [running, setRunning] = React.useState<Running | null>(null)

  // Changes to our triggered workflow indicate either starting a workflow or
  // potentially deleting an active one.
  React.useEffect(() => {
    const workflow = store.triggered
    if (workflow === null) {
      setRunning(null)
      return
    }
    setRunning({ workflow, browserTab: 0, actionIndex: 0, results: [] })
    queryTabsUntilComplete({ active: true, currentWindow: true }).then(
      (tabs) => {
        setRunning({
          workflow,
          browserTab: tabs[0].id!,
          actionIndex: 0,
          results: [],
        })
      }
    )
  }, [store.triggered, setRunning])

  // Process each step of the workflow. On completion, trigger an update to
  // reinvoke this same effect.
  React.useEffect(() => {
    if (
      running === null ||
      running.browserTab === 0 ||
      running.actionIndex >= running.workflow.actions.length ||
      running.results[running.actionIndex]?.success === false
    ) {
      return
    }
    runStep(
      running.browserTab,
      running.workflow.actions[running.actionIndex],
      store.openaiApiKey
    ).then((result) => {
      setRunning({
        ...running,
        results: [...running.results, result],
        actionIndex: result.success
          ? running.actionIndex + 1
          : running.actionIndex,
      })
    })
  }, [running, store.openaiApiKey])

  if (running === null) {
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
        <CardTitle className="flex items-center gap-2">
          {running.results[running.actionIndex]?.success === false ? (
            <CloseIcon className="w-5 h-5 rounded-full fill-red-900" />
          ) : running.actionIndex === running.workflow.actions.length ? (
            <CheckmarkIcon className="w-5 h-5 rounded-full fill-emerald-600" />
          ) : (
            <LoadingIcon className="w-5 h-5 fill-emerald-600" />
          )}
          {running.workflow.init.name}{" "}
        </CardTitle>
        <CardDescription>
          Launched ({running.workflow.uuid.slice(0, 8)})
        </CardDescription>
      </Card>

      <Separator />

      {[...Array(running.actionIndex + 1).keys()].map((index) => {
        if (index === running.workflow.actions.length) {
          return null
        }

        const actions = running.workflow.actions
        const kind = actions[index].kind
        const title = `Step ${index + 1} / ${actions.length}`
        const subtitle = `${kind.slice(0, 1).toUpperCase() + kind.slice(1)}`

        return (
          <StepCard
            key={running.workflow.uuid}
            action={actions[index]}
            title={title}
            subtitle={subtitle}
            isRunning={index === running.actionIndex}
            result={running.results[index] ?? null}
          />
        )
      })}
    </div>
  )
}
RunnerTab.displayName = "RunnerTab"

export default RunnerTab
