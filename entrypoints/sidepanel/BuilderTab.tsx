import React from "react"

import { cn } from "@/utils/shadcn"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSharedStore } from "./store"

import {
  type InitSchema,
  ActionForm,
  initSchema,
  actionFormSafeParse,
  actionFormParams,
} from "@/utils/workflow"
import InitTabPanel from "./builder_tab/InitTabPanel"
import ActionTabPanel from "./builder_tab/ActionTabPanel"

type ActionTab = {
  key: string
  label: string
  params: Set<string>
  form: ActionForm | null
}

const BuilderTab = () => {
  const store = useSharedStore()

  // Used to re-render form on save.
  const [rootKey, setRootKey] = React.useState(0)
  const [initTab, setInitTab] = React.useState<InitSchema | null>(null)
  const [actionTabs, setActionTabs] = React.useState<ActionTab[]>([])
  const [tabActive, setTabActive] = React.useState("init")

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
    if (initTab === null || !initSchema.safeParse(initTab).success) {
      return -1
    }
    let i = 0
    for (; i < actionTabs.length; ++i) {
      const form = actionTabs[i].form
      if (form === null || actionFormSafeParse(form) === null) {
        return i
      }
    }
    return i
  }, [initTab, tabActiveIndex, actionTabs])

  // Accumulate parameters specified in tabs before that of the specified
  // index.
  const accumulateParams = React.useCallback(
    (index: number) => {
      const params = new Set<string>()
      for (let i = 0; i < index; ++i) {
        const form = actionTabs[i].form
        if (form) {
          actionFormParams(form).forEach((p) => params.add(p))
        }
      }
      return params
    },
    [actionTabs]
  )

  const propagateUpdateTabs = React.useCallback(
    (values: ActionForm | null, index: number) => {
      setActionTabs((tabs) => {
        const params = accumulateParams(index)

        const shallowCopy = [...tabs]
        shallowCopy[index].form = values
        shallowCopy[index].params = new Set(params)

        // Notify all subsequent tabs on parameter changes.
        for (let i = index + 1; i < actionTabs.length; ++i) {
          const form = shallowCopy[i].form
          if (form !== null) {
            actionFormParams(form).forEach((p) => params.add(p))
          }
          shallowCopy[i].params = new Set(params)
        }

        return shallowCopy
      })
    },
    [setActionTabs, accumulateParams]
  )

  const saveWorkflow = React.useCallback(() => {
    if (!initTab) {
      throw new Error("Attempted to save invalid `InitSchema`.")
    }
    store.actions.saveWorkflow({
      init: initTab,
      actions: actionTabs
        .map((t) => t.form)
        .filter((f): f is ActionForm => Boolean(f)),
    })
    setTabActive("init")
    setInitTab(null)
    setActionTabs([])
    setRootKey((id) => id + 1)
  }, [
    store.actions,
    initTab,
    actionTabs,
    setTabActive,
    setInitTab,
    setActionTabs,
    setRootKey,
  ])

  return (
    <Tabs
      key={`${rootKey}`}
      className="flex flex-col h-full gap-4"
      value={tabActive}
      onValueChange={setTabActive}
    >
      <TabsList className="flex overflow-x-auto overflow-y-hidden scrollbar justify-start mt-2 mx-4">
        <TabsTrigger
          value="init"
          disabled={store.lockedBy.size > 0}
          className={cn(
            validBeforeIndex === -1
              ? "text-destructive data-[state=active]:bg-destructive"
              : ""
          )}
        >
          Start
        </TabsTrigger>
        {actionTabs.map((tab, index) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            disabled={store.lockedBy.size > 0}
            className={cn(
              index >= validBeforeIndex
                ? "text-destructive data-[state=active]:bg-destructive"
                : ""
            )}
          >
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
        <InitTabPanel onChange={setInitTab} />
      </TabsContent>
      {actionTabs.map((tab, index) => (
        <TabsContent
          key={tab.key}
          className="overflow-y-auto scrollbar h-full px-4"
          value={tab.key}
          forceMount
          hidden={tabActive !== tab.key}
        >
          <ActionTabPanel
            params={tab.params}
            onChange={(values) => propagateUpdateTabs(values, index)}
          />
        </TabsContent>
      ))}

      <div className="flex border-t px-4 py-2">
        <Button
          onClick={() => {
            const nextKey = `step${tabActiveIndex + 1}`
            if (tabActiveIsLast) {
              setActionTabs((tabs) => [
                ...tabs,
                {
                  key: nextKey,
                  label: `Step ${actionTabs.length + 1}`,
                  params: accumulateParams(tabActiveIndex + 1),
                  form: null,
                },
              ])
            }
            setTabActive(nextKey)
          }}
          disabled={
            store.lockedBy.size > 0 ||
            (tabActiveIndex >= validBeforeIndex && tabActiveIsLast)
          }
        >
          {tabActiveIsLast ? "New Step" : "Continue"}
        </Button>
        <Button
          variant="secondary"
          className="ml-auto"
          disabled={
            store.lockedBy.size > 0 || validBeforeIndex < actionTabs.length
          }
          onClick={saveWorkflow}
        >
          Save Workflow
        </Button>
      </div>
    </Tabs>
  )
}
BuilderTab.displayName = "BuilderTab"

export default BuilderTab
