import React from "react"

import CheckmarkIcon from "@/components/icons/Checkmark"
import CloseIcon from "@/components/icons/Close"
import LoadingIcon from "@/components/icons/Loading"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { StepResult } from "@/utils/workflow"
import StepContent from "./StepContent"

type StepCardProps = {
  title: string
  description: string
  action: ActionForm
  result: StepResult | null
}

const StepCard = ({ title, description, action, result }: StepCardProps) => {
  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        {result?.status === "SUCCESS" ? (
          <CheckmarkIcon className="w-5 h-5 rounded-full fill-emerald-600" />
        ) : result?.status === "FAILURE" ? (
          <CloseIcon className="w-5 h-5 fill-red-700" />
        ) : (
          <LoadingIcon className="w-5 h-5 fill-emerald-600" />
        )}
        {title}
      </CardTitle>
      <CardDescription className="pb-2">{description}</CardDescription>
      <StepContent action={action} result={result} />
    </Card>
  )
}

export default StepCard
