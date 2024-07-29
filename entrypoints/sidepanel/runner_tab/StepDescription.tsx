import React from "react"

import { CardDescription } from "@/components/ui/card"

type ActionDescriptionProps = {
  isRunning?: boolean
}

const ActionCaptureDescription = ({ isRunning }: ActionDescriptionProps) => {
  if (isRunning) {
    return <span>Replaying capture...</span>
  }
  return <span>Replayed capture.</span>
}

type ActionNavigateDescriptionProps = ActionDescriptionProps & {
  url: string
}

const ActionNavigateDescription = ({
  url,
  isRunning,
}: ActionNavigateDescriptionProps) => {
  const Link = () => <span className="underline">{url}</span>

  if (isRunning) {
    return (
      <span>
        Navigating to <Link />
        ...
      </span>
    )
  }
  return (
    <span>
      Navigated to <Link />.
    </span>
  )
}

const ActionPromptDescription = ({ isRunning }: ActionDescriptionProps) => {
  if (isRunning) {
    return <span>Sending request to OpenAI...</span>
  }
  return <span>Sent request to OpenAI.</span>
}

type StepDescriptionProps = {
  action: ActionForm
  isRunning?: boolean
}

const StepDescription = ({ action, isRunning }: StepDescriptionProps) => {
  const Description = () => {
    const kind = action.kind

    switch (kind) {
      case ActionKind.CAPTURE: {
        return <ActionCaptureDescription isRunning={isRunning} />
      }
      case ActionKind.NAVIGATE: {
        return (
          <ActionNavigateDescription
            url={action.values.url}
            isRunning={isRunning}
          />
        )
      }
      case ActionKind.PROMPT: {
        return <ActionPromptDescription isRunning={isRunning} />
      }
      default: {
        const _exhaustivenessCheck: never = kind
        break
      }
    }
  }

  return (
    <CardDescription>
      <Description />
    </CardDescription>
  )
}

export default StepDescription
