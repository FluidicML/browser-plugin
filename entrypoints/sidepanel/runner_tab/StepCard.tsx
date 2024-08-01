import React from "react"

import CheckmarkIcon from "@/components/icons/Checkmark"
import CloseIcon from "@/components/icons/Close"
import LoadingIcon from "@/components/icons/Loading"
import { Card, CardTitle } from "@/components/ui/card"
import StepDescription from "./StepDescription"
import StepContent from "./StepContent"

type StepCardProps = {
  title: string
  action: ActionForm
  isRunning: boolean
  result: StepResult | null
}

const StepCard = ({ title, action, isRunning, result }: StepCardProps) => {
  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        {result?.success === true ? (
          <CheckmarkIcon className="w-5 h-5 rounded-full fill-emerald-600" />
        ) : result?.success === false ? (
          <CloseIcon className="w-5 h-5 fill-red-900" />
        ) : isRunning ? (
          <LoadingIcon className="w-5 h-5 fill-emerald-600" />
        ) : (
          <div className="w-5 h-5 rounded-full" />
        )}
        {title}
      </CardTitle>
      <StepDescription action={action} isRunning={isRunning} result={result} />
      <StepContent action={action} />
    </Card>
  )
}

export default StepCard
