import React from "react"

import LoadingIcon from "@/components/icons/Loading"
import { type StepRecordingSchema } from "@/utils/schema"
import { type StepContentProps, TaskStatus } from "./StepContent"

const StepRecordingContent = ({
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
StepRecordingContent.displayName = "StepRecordingContent"

export default StepRecordingContent
