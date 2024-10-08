import React from "react"

import LoadingIcon from "@/components/icons/Loading"
import { type StepRecordingSchema } from "@/utils/schema"
import { type StepContentProps, TaskStatusIcon } from "./StepContent"
import { Button } from "@/components/ui/button"
import { useSharedStore } from "../store"

const StepRecordingContent = ({
  values,
  result,
}: StepContentProps<StepRecordingSchema>) => {
  const store = useSharedStore()

  const latest = result?.results[result.results.length - 1] ?? null
  if (latest === null || result === null) {
    return <span>Loading...</span>
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 pb-2">
        {...result.results.map((task, index) => (
          <TaskStatusIcon key={index} task={task} />
        ))}
        {latest.status !== TaskStatus.FAILED &&
          result.results.length < values.recordings.length && (
            <LoadingIcon className="w-4 h-4 fill-emerald-600" />
          )}
      </div>
      {latest.status === TaskStatus.FAILED ? (
        <span>{latest.message ?? "Aborted"}</span>
      ) : latest.isPaused ? (
        <Button
          className="w-full"
          variant="secondary"
          onClick={() => {
            if (store.runnerActive !== null) {
              const popped = store.runnerActions.popTaskResult(
                store.runnerActive
              )
              store.runnerActions.pushTaskResult(store.runnerActive, {
                ...popped,
                isPaused: false,
                status: TaskStatus.SUCCEEDED,
              })
            }
          }}
        >
          Continue?
        </Button>
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
