import React from "react"

import CheckmarkIcon from "@/components/icons/Checkmark"
import CloseIcon from "@/components/icons/Close"
import LoadingIcon from "@/components/icons/Loading"
import NullIcon from "@/components/icons/Null"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { StepResult } from "@/utils/workflow"

type ActionExtractingProps = {
  values: ActionExtractingSchema
  result: StepResult
}

const ActionExtracting = ({ values, result }: ActionExtractingProps) => {
  const latest = result.tasks[result.tasks.length - 1]

  return (
    <div>
      <div className="flex flex-wrap gap-2 pb-2">
        {...result.tasks.map((task) =>
          task.status === "SUCCESS" ? (
            <CheckmarkIcon className="w-4 h-4 rounded-full fill-emerald-600" />
          ) : task.status === "SKIPPED" ? (
            <NullIcon className="w-4 h-4 rounded-full fill-yellow-700" />
          ) : (
            <CloseIcon className="w-4 h-4 fill-red-700" />
          )
        )}
        {latest?.status !== "FAILURE" &&
          result.tasks.length < values.params.length && (
            <LoadingIcon className="w-4 h-4 fill-emerald-600" />
          )}
      </div>
      {latest?.status === "FAILURE" ? (
        <span>{latest.message ?? "Aborted"}</span>
      ) : result.tasks.length >= values.params.length ? (
        <span>Finished extraction.</span>
      ) : (
        <span>
          Extracting{" "}
          <pre className="inline">
            {values.params[result.tasks.length].name}
          </pre>
          ...
        </span>
      )}
    </div>
  )
}

type ActionRecordingProps = {
  values: ActionRecordingSchema
  result: StepResult
}

const ActionRecording = ({ values, result }: ActionRecordingProps) => {
  const latest = result.tasks[result.tasks.length - 1]

  return (
    <div>
      <div className="flex flex-wrap gap-2 pb-2">
        {...result.tasks.map((task) =>
          task.status === "SUCCESS" ? (
            <CheckmarkIcon className="w-4 h-4 rounded-full fill-emerald-600" />
          ) : task.status === "SKIPPED" ? (
            <NullIcon className="w-4 h-4 rounded-full fill-yellow-700" />
          ) : (
            <CloseIcon className="w-4 h-4 fill-red-700" />
          )
        )}
        {latest?.status !== "FAILURE" &&
          result.tasks.length < values.recordings.length && (
            <LoadingIcon className="w-4 h-4 fill-emerald-600" />
          )}
      </div>
      {latest?.status === "FAILURE" ? (
        <span>{latest.message ?? "Aborted"}</span>
      ) : result.tasks.length >= values.recordings.length ? (
        <span>Finished recording.</span>
      ) : (
        <span>
          Recording{" "}
          <pre className="inline">
            {values.recordings[result.tasks.length].action}
          </pre>
          ...
        </span>
      )}
    </div>
  )
}

type ActionNavigateProps = {
  url: string
  result: StepResult
}

const ActionNavigate = ({ url, result }: ActionNavigateProps) => {
  const Link = () => <span className="underline">{url}</span>

  if (result.tasks.length === 0) {
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
  result: StepResult
}

const ActionOpenAI = ({ result }: ActionOpenAIProps) => {
  if (result.tasks.length === 0) {
    return <span>Sending request to OpenAI...</span>
  }
  if (result.tasks[0]?.status === "FAILURE") {
    return <span>{result.tasks[0].message ?? "Unknown error."}</span>
  }
  return <span>{result.tasks[0].message ?? "Sent request to OpenAI."}</span>
}

type ActionContentProps = {
  action: ActionForm
  result: StepResult
}

const ActionContent = ({ action, result }: ActionContentProps) => {
  const kind = action.kind

  switch (kind) {
    case ActionKind.EXTRACTING: {
      return <ActionExtracting values={action.values} result={result} />
    }
    case ActionKind.RECORDING: {
      return <ActionRecording values={action.values} result={result} />
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

type StepResultCardProps = {
  title: string
  description: string
  action: ActionForm
  result: StepResult
}

const StepResultCard = ({
  title,
  description,
  action,
  result,
}: StepResultCardProps) => {
  const kind = action.kind

  let taskLength
  switch (kind) {
    case ActionKind.EXTRACTING: {
      taskLength = action.values.params.length
      break
    }
    case ActionKind.RECORDING: {
      taskLength = action.values.recordings.length
      break
    }
    default: {
      taskLength = 1
      break
    }
  }

  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        {result.status === "FAILURE" ? (
          <CloseIcon className="w-5 h-5 fill-red-700" />
        ) : result.tasks.length >= taskLength ? (
          <CheckmarkIcon className="w-5 h-5 rounded-full fill-emerald-600" />
        ) : (
          <LoadingIcon className="w-5 h-5 fill-emerald-600" />
        )}
        {title}
      </CardTitle>
      <CardDescription className="pb-2">{description}</CardDescription>
      <CardContent>
        <ActionContent action={action} result={result} />
      </CardContent>
    </Card>
  )
}

export default StepResultCard
