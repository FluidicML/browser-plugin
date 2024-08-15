import React from "react"

import { type Step } from "@/utils/schema"
import CheckmarkIcon from "@/components/icons/Checkmark"
import CloseIcon from "@/components/icons/Close"
import LoadingIcon from "@/components/icons/Loading"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { type StepResult, getStepResultStatus } from "@/utils/workflow"
import StepExtractingContent from "./StepExtractingContent"
import StepInjectingContent from "./StepInjectingContent"
import StepInputContent from "./StepInputContent"
import StepNavigateContent from "./StepNavigateContent"
import StepOpenAIContent from "./StepOpenAIContent"
import StepRecordingContent from "./StepRecordingContent"

type StepCardContentProps = {
  step: Step
  result: StepResult | null
}

const StepCardContent = ({ step, result }: StepCardContentProps) => {
  const kind = step.kind

  switch (kind) {
    case StepKind.EXTRACTING: {
      return <StepExtractingContent values={step.values} result={result} />
    }
    case StepKind.INJECTING: {
      return <StepInjectingContent values={step.values} result={result} />
    }
    case StepKind.NAVIGATE: {
      return <StepNavigateContent values={step.values} result={result} />
    }
    case StepKind.OPENAI: {
      return <StepOpenAIContent values={step.values} result={result} />
    }
    case StepKind.INPUT: {
      return <StepInputContent values={step.values} result={result} />
    }
    case StepKind.RECORDING: {
      return <StepRecordingContent values={step.values} result={result} />
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

  const status = result ? getStepResultStatus(result) : null

  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        {status === StepStatus.FAILED ? (
          <CloseIcon className="w-5 h-5 fill-red-700" />
        ) : result === null ||
          result.results.length < taskLength ||
          result.isPaused ? (
          <LoadingIcon className="w-5 h-5 fill-emerald-600" />
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
