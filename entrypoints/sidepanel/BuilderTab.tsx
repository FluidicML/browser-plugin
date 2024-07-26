import React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { type InitTabSchema } from "./builder_tab/schema"
import InitTabPanel from "./builder_tab/InitTabPanel"
import ActionTabPanel from "./builder_tab/ActionTabPanel"
import { ActionTab } from "./builder_tab/schema"

const BuilderTab = () => {
  const [tabActive, setTabActive] = React.useState("init")
  const [_initTab, setInitTab] = React.useState<InitTabSchema>()
  const [actionTabs, setActionTabs] = React.useState<ActionTab[]>([])

  const newActionTab = (index: number): ActionTab => {
    return {
      key: `step${index}`,
      label: `Step ${index}`,
      values: null,
    }
  }

  const submitInitTab = (values: InitTabSchema) => {
    setInitTab(values)

    const next = newActionTab(1)
    if (actionTabs.length === 0) {
      actionTabs.push(next)
    }
    setTabActive(next.key)
  }

  const submitActionTab = (index: number, values: ActionTab["values"]) => {
    if (index < 0 || index >= actionTabs.length) {
      throw new Error(`Invalid ${index} on tab submission.`)
    }

    const shallowCopy = [...actionTabs]
    shallowCopy[index].values = values

    if (index === actionTabs.length - 1) {
      const next = newActionTab(actionTabs.length)
      shallowCopy.push(next)
      setTabActive(next.key)
    } else {
      const next = newActionTab(index + 1)
      setTabActive(next.key)
    }

    setActionTabs(shallowCopy)
  }

  return (
    <Tabs
      className="flex flex-col h-full"
      value={tabActive}
      onValueChange={setTabActive}
    >
      <TabsList className="flex flex-wrap justify-start">
        <TabsTrigger value="init">Start</TabsTrigger>
        {actionTabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="init" forceMount hidden={tabActive !== "init"}>
        <InitTabPanel onSubmit={submitInitTab} />
      </TabsContent>
      {actionTabs.map((tab, index) => (
        <TabsContent
          key={tab.key}
          className="overflow-y-auto"
          value={tab.key}
          forceMount
          hidden={tabActive !== tab.key}
        >
          <ActionTabPanel
            onSubmit={(values) => submitActionTab(index, values)}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
BuilderTab.displayName = "BuilderTab"

export default BuilderTab
