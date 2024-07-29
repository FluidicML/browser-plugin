import React from "react"

import FolderIcon from "@/components/icons/Folder"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { useSharedStore } from "./store"

type StepDescriptionProps = {
  action: ActionForm
  isRunning?: boolean
}

const StepDescription = ({ action, isRunning }: StepDescriptionProps) => {
  const getDescription = () => {
    const kind = action.kind

    switch (kind) {
      case ActionKind.CAPTURE: {
        return (
          <span>
            {isRunning ? "Replaying capture..." : "Replayed capture."}
          </span>
        )
      }
      case ActionKind.NAVIGATE: {
        const Link = () => (
          <span className="underline">{action.values.url}</span>
        )
        if (isRunning) {
          return (
            <span>
              Navigating to <Link />
              ...
            </span>
          )
        } else {
          return (
            <span>
              Navigated to <Link />.
            </span>
          )
        }
      }
      case ActionKind.PROMPT: {
        return (
          <span>
            {isRunning
              ? "Sending request to OpenAI..."
              : "Sent request to OpenAI."}
          </span>
        )
      }
      default: {
        const _exhaustivenessCheck: never = kind
        break
      }
    }
  }

  return <CardDescription>{getDescription()}</CardDescription>
}

type StepContentProps = {
  action: ActionForm
}

const StepContent = ({ action }: StepContentProps) => {
  return <CardContent />
}

type StepCardProps = {
  title: string
  action: ActionForm
}

const StepCard = ({ title, action }: StepCardProps) => {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <StepDescription action={action} />
      <StepContent action={action} />
    </Card>
  )
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

  const runStep = React.useCallback(async () => {
    if (running === null) {
      return
    }

    const action = running.workflow.actions[running.actionIndex]
    const kind = action.kind

    switch (kind) {
      case ActionKind.CAPTURE: {
        break
      }
      case ActionKind.NAVIGATE: {
        await browser.tabs.update(running.browserTab, {
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
  }, [running])

  React.useEffect(() => {
    if (
      running === null ||
      running.actionIndex >= running.workflow.actions.length
    ) {
      return
    }
    runStep().then(() =>
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
      {[...Array(running.actionIndex).keys()].map((index: number) => (
        <StepCard
          action={running.workflow.actions[index]}
          title={`Step ${index + 1} / ${running.workflow.actions.length}`}
        />
      ))}
      {running.actionIndex < running.workflow.actions.length ? (
        <StepCard
          action={running.workflow.actions[running.actionIndex]}
          title={`Step ${running.actionIndex + 1} / ${running.workflow.actions.length}`}
        />
      ) : null}
    </div>
  )
}

export default RunnerTab
