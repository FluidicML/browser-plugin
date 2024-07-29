import React from "react"

import FolderIcon from "@/components/icons/Folder"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { useSharedStore } from "./store"

import StepCard from "./runner_tab/StepCard"

const runStep = async (browserTab: number, action: ActionForm) => {
  const kind = action.kind

  switch (kind) {
    case ActionKind.CAPTURE: {
      break
    }
    case ActionKind.NAVIGATE: {
      await browser.tabs.update(browserTab, {
        url: action.values.url,
      })
      break
    }
    case ActionKind.PROMPT: {
      break
    }
    default: {
      const _exhaustivenessCheck: never = kind
      break
    }
  }
}

type Running = {
  workflow: Workflow
  browserTab: number
  actionIndex: number
}

const RunnerTab = () => {
  const store = useSharedStore()

  // TODO: Should handle when the active tab is shutdown.

  const [running, setRunning] = React.useState<Running | null>(null)

  React.useEffect(() => {
    const triggered = store.triggered

    if (triggered === null) {
      setRunning(null)
      return
    }

    browser.tabs.create({ url: triggered.init.url }).then((tab) => {
      setRunning({
        workflow: triggered,
        browserTab: tab.id!,
        actionIndex: 0,
      })
    })
  }, [store.triggered, setRunning])

  React.useEffect(() => {
    if (
      running === null ||
      running.actionIndex >= running.workflow.actions.length
    ) {
      return
    }

    runStep(
      running.browserTab,
      running.workflow.actions[running.actionIndex]
    ).then(() =>
      setRunning({ ...running, actionIndex: running.actionIndex + 1 })
    )
  }, [running])

  if (running === null) {
    return (
      <div className="flex flex-col items-center gap-2 p-4">
        <FolderIcon className="w-12 h-12 fill-black dark:fill-white" />
        <p className="text-center text-base">No running workflow.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <CardTitle>
          {running.workflow.init.name}{" "}
          <span className="text-xs text-muted-foreground float-right">
            ({running.workflow.uuid.slice(0, 8)})
          </span>
        </CardTitle>
        <CardDescription>
          Launched{" "}
          <span className="underline">{running.workflow.init.url}</span>.
        </CardDescription>
      </Card>
      {[...Array(running.actionIndex + 1).keys()].map((index: number) => {
        if (index === running.workflow.actions.length) {
          return null
        }
        return (
          <StepCard
            action={running.workflow.actions[index]}
            title={`Step ${index + 1} / ${running.workflow.actions.length}`}
            isRunning={index === running.actionIndex}
          />
        )
      })}
    </div>
  )
}

export default RunnerTab
