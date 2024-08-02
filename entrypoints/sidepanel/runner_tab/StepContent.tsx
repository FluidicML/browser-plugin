import { CardContent } from "@/components/ui/card"

type ActionRecordingProps = {
  isRunning: boolean
}

const ActionRecording = ({ isRunning }: ActionRecordingProps) => {
  if (isRunning) {
    return <span>Replaying recording...</span>
  }
  return <span>Replayed recording.</span>
}

type ActionNavigateProps = {
  isRunning: boolean
  url: string
}

const ActionNavigate = ({ isRunning, url }: ActionNavigateProps) => {
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

type ActionPromptProps = {
  isRunning: boolean
}

const ActionPrompt = ({ isRunning }: ActionPromptProps) => {
  if (isRunning) {
    return <span>Sending request to OpenAI...</span>
  }
  return <span>Sent request to OpenAI.</span>
}

type ActionContentProps = {
  action: ActionForm
  isRunning: boolean
  result: StepResult | null
}

const ActionContent = ({ action, isRunning, result }: ActionContentProps) => {
  if (result && result.messages.length > 0) {
    return (
      <ol className="pl-4 list-decimal">
        {result.messages.map((m, index) => (
          <li key={index}>{m}</li>
        ))}
      </ol>
    )
  }

  const kind = action.kind

  switch (kind) {
    case ActionKind.EXTRACTING: {
      return null
    }
    case ActionKind.RECORDING: {
      return <ActionRecording isRunning={isRunning} />
    }
    case ActionKind.NAVIGATE: {
      return <ActionNavigate url={action.values.url} isRunning={isRunning} />
    }
    case ActionKind.PROMPT: {
      return <ActionPrompt isRunning={isRunning} />
    }
    default: {
      const _exhaustivenessCheck: never = kind
      break
    }
  }
}

const StepContent = (props: ActionContentProps) => {
  return (
    <CardContent>
      <ActionContent {...props} />
    </CardContent>
  )
}

export default StepContent
