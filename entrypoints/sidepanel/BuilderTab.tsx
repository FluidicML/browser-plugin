import React from "react"

import SettingsForm from "./builder_form/SettingsForm"

const BuilderTab = () => {
  const [settings, setSettings] = React.useState<{
    workflowName: string
    launchUrl: string
  } | null>(null)

  if (settings === null) {
    return <SettingsForm onSubmit={(values) => setSettings(values)} />
  }

  return <div />
}
BuilderTab.displayName = "BuilderTab"

export default BuilderTab
