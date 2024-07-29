import React from "react"

import CheckmarkIcon from "@/components/icons/Checkmark"
import LoadingIcon from "@/components/icons/Loading"
import { Card, CardTitle } from "@/components/ui/card"

import StepDescription from "./StepDescription"
import StepContent from "./StepContent"

type StepCardProps = {
  title: string
  action: ActionForm
  isRunning?: boolean
}

const StepCard = ({ title, action, isRunning }: StepCardProps) => {
  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        {isRunning ? (
          <LoadingIcon className="w-5 h-5 fill-emerald-600" />
        ) : (
          <CheckmarkIcon className="w-5 h-5 rounded-full bg-white fill-emerald-600" />
        )}
        {title}
      </CardTitle>
      <StepDescription action={action} isRunning={isRunning} />
      <StepContent action={action} />
    </Card>
  )
}

export default StepCard
