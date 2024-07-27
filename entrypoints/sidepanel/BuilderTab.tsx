import React from "react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  type InitSchema,
  ActionForm,
  initSchema,
  actionFormSafeParse,
} from "@/utils/workflow"
import InitTabPanel from "./builder_tab/InitTabPanel"
import ActionTabPanel, { type ActionTab } from "./builder_tab/ActionTabPanel"

const BuilderTab = () => {
  const [tabActive, setTabActive] = React.useState("init")
  const [initTab, setInitTab] = React.useState<InitSchema>()
  const [actionTabs, setActionTabs] = React.useState<ActionTab[]>([])

  // Retrieves the index of the active tab. For uniformity, the "init" tab is
  // treated as if it has index `-1` in the `actionTabs` array.
  const tabActiveIndex = React.useMemo(() => {
    return actionTabs.findIndex((tab) => tab.key === tabActive)
  }, [tabActive, actionTabs])

  // Checks if the active tab is also the last tab in the workflow.
  const tabActiveIsLast = React.useMemo(() => {
    return tabActiveIndex === actionTabs.length - 1
  }, [tabActive, actionTabs])

  // Because we can edit steps out of order, we may also invalidate later steps
  // when updating a previous one. Indices before this one refer to validated
  // action forms.
  const validBeforeIndex = React.useMemo(() => {
    if (!initSchema.safeParse(initTab).success) {
      return -1
    }
    let i = 0
    for (; i < actionTabs.length; ++i) {
      const form = actionTabs[i].form
      if (form === undefined || actionFormSafeParse(form) === null) {
        return i
      }
    }
    return i
  }, [initTab, actionTabs])

  const updateActionTab = React.useCallback(
    (values: ActionForm, index: number) => {
      const shallowCopy = [...actionTabs]
      shallowCopy[index].form = values
      setActionTabs(shallowCopy)
    },
    [actionTabs, setActionTabs]
  )

  return (
    <Tabs
      className="flex flex-col h-full gap-4"
      value={tabActive}
      onValueChange={setTabActive}
    >
      <TabsList className="flex flex-wrap justify-start mt-2 mx-4">
        <TabsTrigger value="init">Start</TabsTrigger>
        {actionTabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent
        className="h-full px-4"
        value="init"
        forceMount
        hidden={tabActive !== "init"}
      >
        <InitTabPanel onValidInput={setInitTab} />
      </TabsContent>
      {actionTabs.map((tab, index) => (
        <TabsContent
          key={tab.key}
          className="overflow-y-auto h-full px-4"
          value={tab.key}
          forceMount
          hidden={tabActive !== tab.key}
        >
          <ActionTabPanel
            onValidInput={(values) => {
              updateActionTab(values, index)
              // TODO: Check which of any later tabs are valid.
            }}
          />
        </TabsContent>
      ))}
      <div className="flex border-t px-4 py-2">
        <Button
          onClick={() => {
            const nextKey = `step${tabActiveIndex + 1}`
            if (tabActiveIsLast) {
              setActionTabs([
                ...actionTabs,
                { key: nextKey, label: `Step ${actionTabs.length + 1}` },
              ])
            }
            setTabActive(nextKey)
          }}
          disabled={tabActiveIndex >= validBeforeIndex}
        >
          {tabActiveIsLast ? "New Step" : "Continue"}
        </Button>
        <Button
          variant="secondary"
          className="ml-auto"
          disabled={validBeforeIndex < actionTabs.length}
        >
          Save Workflow
        </Button>
      </div>
    </Tabs>
  )
}
BuilderTab.displayName = "BuilderTab"

export default BuilderTab
