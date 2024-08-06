import React from "react"

import LoadingIcon from "@/components/icons/Loading"
import { type StepExtractingSchema } from "@/utils/schema"
import { type StepContentProps, TaskStatusIcon } from "./StepContent"

const StepExtractingContent = ({
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
          <TaskStatusIcon key={index} task={task} />
        ))}
        {latest.status !== TaskStatus.FAILED &&
          result.results.length < values.params.length && (
            <LoadingIcon className="w-4 h-4 fill-emerald-600" />
          )}
      </div>
      {latest.status === TaskStatus.FAILED ? (
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
StepExtractingContent.displayName = "StepExtractingContent"

export default StepExtractingContent
