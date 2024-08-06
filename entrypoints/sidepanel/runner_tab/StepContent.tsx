import { CardContent } from "@/components/ui/card"
import { StepResult } from "@/utils/workflow"

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
  result: StepResult
  finished: boolean
}

const ActionContent = ({ action, result }: ActionContentProps) => {
  // TODO: Add success or failure or pending status. Setup grid for each task.
  if (result?.tasks && result.tasks.length > 0) {
    return (
      <ol className="pl-4 list-decimal">
        {result.tasks.map((task, index) => (
          <li key={`${task.message}${index}`}>{task.message}</li>
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
