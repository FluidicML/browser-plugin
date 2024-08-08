import React from "react"

import { type StepNavigateSchema } from "$/utils/schema"
import { type StepContentProps } from "./StepContent"
import { TaskStatus } from "$/utils/workflow"

const StepNavigateContent = ({
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

  if (latest.status !== TaskStatus.SUCCEEDED) {
    return <span>{latest.message ?? "Unknown error."}</span>
  }

  return (
    <span>
      Navigated to <span className="underline">{values.url}</span>.
    </span>
  )
}
StepNavigateContent.displayName = "StepNavigateContent"

export default StepNavigateContent
