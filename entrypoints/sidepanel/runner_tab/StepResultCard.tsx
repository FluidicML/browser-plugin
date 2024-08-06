import React from "react"

import CheckmarkIcon from "@/components/icons/Checkmark"
import CloseIcon from "@/components/icons/Close"
import LoadingIcon from "@/components/icons/Loading"
import NullIcon from "@/components/icons/Null"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { type StepResult, getStepResultStatus } from "@/utils/workflow"
import { useSharedStore } from "../store"

const TaskStatus = ({ task }: { task: TaskResult }) => {
  if (task.status === "SUCCEEDED") {
    return <CheckmarkIcon className="w-4 h-4 rounded-full fill-emerald-600" />
  }
  if (task.status === "SKIPPED") {
    return <NullIcon className="w-4 h-4 rounded-full fill-yellow-700" />
  }
  return <CloseIcon className="w-4 h-4 fill-red-700" />
}

type StepContentProps<V> = {
  values: V
  result: StepResult | null
}

const StepContentExtracting = ({
  values,
  result,
}: StepContentProps<StepExtractingSchema>) => {
  const latest = result?.results[result.results.length - 1] ?? null

  if (result === null || latest === null) {
    return <span>Loading...</span>
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 pb-2">
        {...result.results.map((task, index) => (
          <TaskStatus key={index} task={task} />
        ))}
        {latest.status !== "FAILED" &&
          result.results.length < values.params.length && (
            <LoadingIcon className="w-4 h-4 fill-emerald-600" />
          )}
      </div>
      {latest.status === "FAILED" ? (
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
    </>
  )
}

const StepContentNavigate = ({
  values,
  result,
}: StepContentProps<StepNavigateSchema>) => {
  const latest = result?.results[result.results.length - 1] ?? null

  if (latest === null || result === null) {
    return (
      <span>
        Navigating to <span className="underline">{values.url}</span>
        ...
      </span>
    )
  }

  if (latest.status !== "SUCCEEDED") {
    return <span>{latest.message ?? "Unknown error."}</span>
  }

  return (
    <span>
      Navigated to <span className="underline">{values.url}</span>.
    </span>
  )
}

const StepContentOpenAI = ({ result }: StepContentProps<StepOpenAISchema>) => {
  const latest = result?.results[result.results.length - 1] ?? null

  if (latest === null || result === null) {
    return <span>Sending request to OpenAI...</span>
  }

  if (latest.status === "FAILED") {
    return <span>{latest.message ?? "Unknown error."}</span>
  }

  return <span>{latest.message ?? "Sent request to OpenAI."}</span>
}

const StepContentPrompt = ({ result }: StepContentProps<StepPromptSchema>) => {
  const store = useSharedStore()
  const latest = result?.results[result.results.length - 1] ?? null

  if (latest === null || result === null) {
    return <span>Loading...</span>
  }

  if (latest.status === "FAILED") {
    return <span>{latest.message ?? "Unknown error."}</span>
  }

  if (latest.status === "PAUSED") {
    return (
      <Button
        onClick={() => {
          store.runnerActions.popTaskResult()
          store.runnerActions.pushTaskResult({ status: "SUCCEEDED" })
        }}
      >
        Test
      </Button>
    )
  }

  return <span>{latest.message ?? "Sent request to OpenAI."}</span>
}

const StepContentRecording = ({
  values,
  result,
}: StepContentProps<StepRecordingSchema>) => {
  const latest = result?.results[result.results.length - 1] ?? null
  if (latest === null || result === null) {
    return <span>Loading...</span>
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 pb-2">
        {...result.results.map((task, index) => (
          <TaskStatus key={index} task={task} />
        ))}
        {latest.status !== "FAILED" &&
          result.results.length < values.recordings.length && (
            <LoadingIcon className="w-4 h-4 fill-emerald-600" />
          )}
      </div>
      {latest.status === "FAILED" ? (
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
    </>
  )
}

type StepCardContentProps = {
  step: Step
  result: StepResult | null
}

const StepCardContent = ({ step, result }: StepCardContentProps) => {
  const kind = step.kind

  switch (kind) {
    case StepKind.EXTRACTING: {
      return <StepContentExtracting values={step.values} result={result} />
    }
    case StepKind.NAVIGATE: {
      return <StepContentNavigate values={step.values} result={result} />
    }
    case StepKind.OPENAI: {
      return <StepContentOpenAI values={step.values} result={result} />
    }
    case StepKind.PROMPT: {
      return <StepContentPrompt values={step.values} result={result} />
    }
    case StepKind.RECORDING: {
      return <StepContentRecording values={step.values} result={result} />
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
  result: StepResult | null
}

const StepResultCard = ({
  title,
  description,
  step,
  result,
}: StepResultCardProps) => {
  let taskLength
  switch (step?.kind) {
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

  const status = result ? getStepResultStatus(result) : "PAUSED"

  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        {result === null ||
        result.results.length < taskLength ||
        status === "PAUSED" ? (
          <LoadingIcon className="w-5 h-5 fill-emerald-600" />
        ) : status === "FAILED" ? (
          <CloseIcon className="w-5 h-5 fill-red-700" />
        ) : (
          <CheckmarkIcon className="w-5 h-5 rounded-full fill-emerald-600" />
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
