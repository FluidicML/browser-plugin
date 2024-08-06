import React from "react"

import { type StepResult } from "@/utils/workflow"
import CheckmarkIcon from "@/components/icons/Checkmark"
import CloseIcon from "@/components/icons/Close"
import NullIcon from "@/components/icons/Null"

export type StepContentProps<V> = {
  values: V
  result: StepResult | null
}

export const TaskStatus = ({ task }: { task: TaskResult }) => {
  if (task.status === "SUCCEEDED") {
    return <CheckmarkIcon className="w-4 h-4 rounded-full fill-emerald-600" />
  }
  if (task.status === "SKIPPED") {
    return <NullIcon className="w-4 h-4 rounded-full fill-yellow-700" />
  }
  return <CloseIcon className="w-4 h-4 fill-red-700" />
}
