import React from "react"

import CheckmarkIcon from "@/components/icons/Checkmark"
import CloseIcon from "@/components/icons/Close"
import LoadingIcon from "@/components/icons/Loading"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import StepContent from "./StepContent"

type StepCardProps = {
  title: string
  subtitle: string
  action: ActionForm
  isRunning: boolean
  result: StepResult | null
}

const StepCard = ({
  title,
  subtitle,
  action,
  isRunning,
  result,
}: StepCardProps) => {
  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        {result?.status === "SUCCESS" ? (
          <CheckmarkIcon className="w-5 h-5 rounded-full fill-emerald-600" />
        ) : result?.status === "FAILURE" ? (
          <CloseIcon className="w-5 h-5 fill-red-700" />
        ) : isRunning ? (
          <LoadingIcon className="w-5 h-5 fill-emerald-600" />
        ) : (
          <div className="w-5 h-5 rounded-full" />
        )}
        {title}
      </CardTitle>
      <CardDescription className="pb-2">{subtitle}</CardDescription>
      <StepContent action={action} isRunning={isRunning} result={result} />
    </Card>
  )
}

export default StepCard
