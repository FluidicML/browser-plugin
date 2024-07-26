import React from "react"

import SettingsForm from "./builder_form/SettingsForm"
import StepsForm from "./builder_form/StepsForm"

const BuilderTab = () => {
  const [settings, setSettings] = React.useState<{
    workflowName: string
    launchUrl: string
  } | null>(null)

  if (settings === null) {
    return <SettingsForm onSubmit={(values) => setSettings(values)} />
  }

  return <StepsForm {...settings} />
}
BuilderTab.displayName = "BuilderTab"

export default BuilderTab
