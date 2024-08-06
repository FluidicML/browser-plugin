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
import { type StepResult, getStepResultStatus } from "@/utils/workflow"

type StepExtractingProps = {
  values: StepExtractingSchema
  result: StepResult
}

const StepExtracting = ({ values, result }: StepExtractingProps) => {
  const latest = result.results[result.results.length - 1]

  return (
    <div>
      <div className="flex flex-wrap gap-2 pb-2">
        {...result.results.map((task) =>
          task.status === "SUCCEEDED" ? (
            <CheckmarkIcon className="w-4 h-4 rounded-full fill-emerald-600" />
          ) : task.status === "SKIPPED" ? (
            <NullIcon className="w-4 h-4 rounded-full fill-yellow-700" />
          ) : (
            <CloseIcon className="w-4 h-4 fill-red-700" />
          )
        )}
        {latest?.status !== "FAILED" &&
          result.results.length < values.params.length && (
            <LoadingIcon className="w-4 h-4 fill-emerald-600" />
          )}
      </div>
      {latest?.status === "FAILED" ? (
        <span>{latest.message ?? "Aborted"}</span>
      ) : result.results.length >= values.params.length ? (
        <span>Finished extraction.</span>
      ) : (
        <span>
          Extracting{" "}
          <pre className="inline">
            {values.params[result.results.length].name}
          </pre>
          ...
        </span>
      )}
    </div>
  )
}

type StepRecordingProps = {
  values: StepRecordingSchema
  result: StepResult
}

const StepRecording = ({ values, result }: StepRecordingProps) => {
  const latest = result.results[result.results.length - 1]

  return (
    <div>
      <div className="flex flex-wrap gap-2 pb-2">
        {...result.results.map((task) =>
          task.status === "SUCCEEDED" ? (
            <CheckmarkIcon className="w-4 h-4 rounded-full fill-emerald-600" />
          ) : task.status === "SKIPPED" ? (
            <NullIcon className="w-4 h-4 rounded-full fill-yellow-700" />
          ) : (
            <CloseIcon className="w-4 h-4 fill-red-700" />
          )
        )}
        {latest?.status !== "FAILED" &&
          result.results.length < values.recordings.length && (
            <LoadingIcon className="w-4 h-4 fill-emerald-600" />
          )}
      </div>
      {latest?.status === "FAILED" ? (
        <span>{latest.message ?? "Aborted"}</span>
      ) : result.results.length >= values.recordings.length ? (
        <span>Finished recording.</span>
      ) : (
        <span>
          Recording{" "}
          <pre className="inline">
            {values.recordings[result.results.length].action}
          </pre>
          ...
        </span>
      )}
    </div>
  )
}

type StepNavigateProps = {
  url: string
  result: StepResult
}

const StepNavigate = ({ url, result }: StepNavigateProps) => {
  const Link = () => <span className="underline">{url}</span>

  if (result.results.length === 0) {
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

type StepOpenAIProps = {
  result: StepResult
}

const StepOpenAI = ({ result }: StepOpenAIProps) => {
  if (result.results.length === 0) {
    return <span>Sending request to OpenAI...</span>
  }
  if (result.results[0]?.status === "FAILED") {
    return <span>{result.results[0].message ?? "Unknown error."}</span>
  }
  return <span>{result.results[0].message ?? "Sent request to OpenAI."}</span>
}

type StepCardContentProps = {
  step: Step
  result: StepResult
}

const StepCardContent = ({ step, result }: StepCardContentProps) => {
  const kind = step.kind

  switch (kind) {
    case StepKind.EXTRACTING: {
      return <StepExtracting values={step.values} result={result} />
    }
    case StepKind.NAVIGATE: {
      return <StepNavigate url={step.values.url} result={result} />
    }
    case StepKind.OPENAI: {
      return <StepOpenAI result={result} />
    }
    case StepKind.RECORDING: {
      return <StepRecording values={step.values} result={result} />
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
  step: Step
  result: StepResult
}

const StepResultCard = ({
  title,
  description,
  step,
  result,
}: StepResultCardProps) => {
  const kind = step.kind

  let taskLength
  switch (kind) {
    case StepKind.EXTRACTING: {
      taskLength = step.values.params.length
      break
    }
    case StepKind.RECORDING: {
      taskLength = step.values.recordings.length
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
        {getStepResultStatus(result) === "FAILED" ? (
          <CloseIcon className="w-5 h-5 fill-red-700" />
        ) : result.results.length >= taskLength ? (
          <CheckmarkIcon className="w-5 h-5 rounded-full fill-emerald-600" />
        ) : (
          <LoadingIcon className="w-5 h-5 fill-emerald-600" />
        )}
        {title}
      </CardTitle>
      <CardDescription className="pb-2">{description}</CardDescription>
      <CardContent>
        <StepCardContent step={step} result={result} />
      </CardContent>
    </Card>
  )
}

export default StepResultCard
