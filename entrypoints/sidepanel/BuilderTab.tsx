import React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import SettingsTabPanel from "./builder_tab/SettingsTabPanel"
import StepsTabPanel from "./builder_tab/StepsTabPanel"

type Tab = {
  value: string
  label: string
  values?: Record<string, any>
}

const BuilderTab = () => {
  const [tabValue, setTabValue] = React.useState("settings")
  const [tabs, setTabs] = React.useState<Tab[]>([
    { value: "settings", label: "Settings" },
  ])

  const submitTab = (index: number, newValues: Record<string, any>) => {
    if (index < 0 || index >= tabs.length) {
      return
    }

    const shallowCopy = [...tabs]
    shallowCopy[index].values = newValues

    if (index === tabs.length - 1) {
      shallowCopy.push({
        value: `step${tabs.length}`,
        label: `Step ${tabs.length}`,
      })
      setTabValue(`step${tabs.length}`)
    } else {
      setTabValue(`step${index + 1}`)
    }
    setTabs(shallowCopy)
  }

  return (
    <Tabs value={tabValue} onValueChange={setTabValue}>
      <TabsList className="flex flex-wrap justify-start">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab, index) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          forceMount
          hidden={tabValue !== tab.value}
        >
          {tab.value === "settings" ? (
            <SettingsTabPanel onSubmit={(values) => submitTab(index, values)} />
          ) : (
            <StepsTabPanel onSubmit={(values) => submitTab(index, values)} />
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
BuilderTab.displayName = "BuilderTab"

export default BuilderTab
