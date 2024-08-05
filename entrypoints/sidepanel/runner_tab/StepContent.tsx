import { CardContent } from "@/components/ui/card"

type ActionRecordingProps = {
  result: StepResult | null
}

const ActionRecording = ({ result }: ActionRecordingProps) => {
  if (result === null) {
    return <span>Replaying recording...</span>
  }
  return <span>Replayed recording.</span>
}

type ActionNavigateProps = {
  result: StepResult | null
  url: string
}

const ActionNavigate = ({ result, url }: ActionNavigateProps) => {
  const Link = () => <span className="underline">{url}</span>

  if (result === null) {
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

type ActionOpenAIProps = {
  result: StepResult | null
}

const ActionOpenAI = ({ result }: ActionOpenAIProps) => {
  if (result === null) {
    return <span>Sending request to OpenAI...</span>
  }
  return <span>Sent request to OpenAI.</span>
}

type ActionContentProps = {
  action: ActionForm
  result: StepResult | null
}

const ActionContent = ({ action, result }: ActionContentProps) => {
  if (result?.messages && result.messages.length > 0) {
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
      return <ActionRecording result={result} />
    }
    case ActionKind.NAVIGATE: {
      return <ActionNavigate url={action.values.url} result={result} />
    }
    case ActionKind.OPENAI: {
      return <ActionOpenAI result={result} />
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
