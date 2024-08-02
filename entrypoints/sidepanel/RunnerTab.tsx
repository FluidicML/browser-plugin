import React from "react"

import type {
  ReplayingClickMessage,
  ReplayingKeyupMessage,
} from "@/utils/messages"
import CheckmarkIcon from "@/components/icons/Checkmark"
import CloseIcon from "@/components/icons/Close"
import FolderIcon from "@/components/icons/Folder"
import LoadingIcon from "@/components/icons/Loading"
import { Separator } from "@/components/ui/separator"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { MessageEvent, sendTab } from "@/utils/messages"
import { useSharedStore } from "./store"
import {
  createTabUntilComplete,
  updateTabUntilComplete,
} from "@/utils/browser_tabs"
import StepCard from "./runner_tab/StepCard"

const runRecordingStep = async (
  browserTab: number,
  values: ActionRecordingSchema
): Promise<StepResult> => {
  let result: StepResult = { success: true, messages: [] }

  for (const recording of values.recordings) {
    let next: StepResult
    const action = recording.action

    switch (action) {
      case "click": {
        next = await sendTab<ReplayingClickMessage>(browserTab, {
          event: MessageEvent.REPLAYING_CLICK,
          payload: { selector: recording.selector },
        })
        break
      }
      case "keyup": {
        next = await sendTab<ReplayingKeyupMessage>(browserTab, {
          event: MessageEvent.REPLAYING_KEYUP,
          payload: { selector: recording.selector, value: recording.value },
        })
        break
      }
      default: {
        next = action
        break
      }
    }

    result.success = next.success
    result.messages.push(...next.messages)

    if (!result.success) {
      return result
    }
  }

  return result
}

const runStep = async (
  browserTab: number,
  action: ActionForm
): Promise<StepResult> => {
  const kind = action.kind

  switch (kind) {
    case ActionKind.EXTRACTING: {
      return { success: false, messages: ["Unsupported EXTRACTING action."] }
    }
    case ActionKind.RECORDING: {
      return await runRecordingStep(browserTab, action.values)
    }
    case ActionKind.NAVIGATE: {
      await updateTabUntilComplete(browserTab, { url: action.values.url })
      return { success: true, messages: [] }
    }
    case ActionKind.OPENAI: {
      return { success: false, messages: ["Unsupported OPENAI action."] }
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
    createTabUntilComplete({ url: workflow.init.url }).then((tab) => {
      setRunning({ workflow, browserTab: tab.id!, actionIndex: 0, results: [] })
    })
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
      running.workflow.actions[running.actionIndex]
    ).then((result) => {
      setRunning({
        ...running,
        results: [...running.results, result],
        actionIndex: result.success
          ? running.actionIndex + 1
          : running.actionIndex,
      })
    })
  }, [running])

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
          <span className="text-xs text-muted-foreground ml-auto">
            ({running.workflow.uuid.slice(0, 8)})
          </span>
        </CardTitle>
        <CardDescription>
          Launched{" "}
          <span className="underline">{running.workflow.init.url}</span>.
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
        const subtitle = `Replay ${kind.slice(0, 1).toUpperCase() + kind.slice(1)}.`

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
