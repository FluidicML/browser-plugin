import React from "react"

import LoadingIcon from "$/components/icons/Loading"
import { type StepInjectingSchema } from "$/utils/schema"
import { TaskStatus } from "$/utils/workflow"
import { type StepContentProps, TaskStatusIcon } from "./StepContent"

const StepInjectingContent = ({
  values,
  result,
}: StepContentProps<StepInjectingSchema>) => {
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
          result.results.length < values.targets.length && (
            <LoadingIcon className="w-4 h-4 fill-emerald-600" />
          )}
      </div>
      {latest.status === TaskStatus.FAILED ? (
        <span>{latest.message ?? "Aborted"}</span>
      ) : result.results.length >= values.targets.length ? (
        <span>Finished injection.</span>
      ) : (
        <span>
          Extracting{" "}
          <pre className="inline">
            {values.targets[result.results.length].name}
          </pre>
          ...
        </span>
      )}
    </>
  )
}
StepInjectingContent.displayName = "StepInjectingContent"

export default StepInjectingContent
