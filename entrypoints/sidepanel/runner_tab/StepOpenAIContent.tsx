import React from "react"

import { type StepOpenAISchema } from "@/utils/schema"
import { type StepContentProps } from "./StepContent"

const StepOpenAIContent = ({ result }: StepContentProps<StepOpenAISchema>) => {
  const latest = result?.results[result.results.length - 1] ?? null

  if (latest === null || result === null) {
    return <span>Sending request to OpenAI...</span>
  }

  if (latest.status === "FAILED") {
    return <span>{latest.message ?? "Unknown error."}</span>
  }

  return <span>{latest.message ?? "Sent request to OpenAI."}</span>
}
StepOpenAIContent.displayName = "StepOpenAIContent"

export default StepOpenAIContent
