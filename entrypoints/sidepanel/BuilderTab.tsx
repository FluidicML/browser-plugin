import React from "react"
import { cn } from "@/utils/shadcn"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSharedStore } from "./store"
import { v4 as uuidv4 } from "uuid"

import {
  type InitSchema,
  ActionForm,
  initSchema,
  actionFormSafeParse,
  actionFormParams,
} from "@/utils/schema"
import InitTabPanel from "./builder_tab/InitTabPanel"
import ActionTabPanel from "./builder_tab/ActionTabPanel"

type ActionTab = {
  key: string
  label: string
  form: ActionForm | null
}

const BuilderTab = () => {
  const store = useSharedStore()

  const [uuid, setUUID] = React.useState(uuidv4())
  const [initTab, setInitTab] = React.useState<InitSchema | null>(null)
  const [actionTabs, setActionTabs] = React.useState<ActionTab[]>([])

  React.useEffect(() => {
    if (store.editing === null) {
      return
    }
    setUUID(store.editing.uuid)
    setInitTab(store.editing.init)
    setActionTabs(
      store.editing.actions.map((form, index) => ({
        key: uuidv4(),
        label: `Step ${index + 1}`,
        form,
      }))
    )
    store.actions.editWorkflow(null)
  }, [store.editing])

  const [tabActive, setTabActive] = React.useState("-1")
  // Retrieves the index of the active tab. For uniformity, the "init" tab is
  // treated as if it has index `-1` in the `actionTabs` array.
  const tabActiveIndex = parseInt(tabActive)
  // Checks if the active tab is also the last tab in the workflow.
  const tabActiveLast = tabActiveIndex === actionTabs.length - 1

  const tabParams = React.useCallback(
    (index: number) => {
      if (index < 0) {
        return new Set<string>()
      }
      const params = new Set<string>()
      for (let i = 0; i < Math.min(index, actionTabs.length); ++i) {
        const form = actionTabs[i].form
        if (form) {
          actionFormParams(form).forEach((p) => params.add(p))
        }
      }
      return params
    },
    [actionTabs]
  )

  const tabValid = React.useCallback(
    (index: number) => {
      if (index < 0) {
        return initTab !== null && initSchema.safeParse(initTab).success
      }
      for (let i = 0; i < Math.min(index + 1, actionTabs.length); ++i) {
        const form = actionTabs[i].form
        if (form === null || actionFormSafeParse(form)?.success !== true) {
          return false
        }
      }
      return true
    },
    [initTab, actionTabs]
  )

  const tabUpdateForm = React.useCallback(
    (form: ActionForm | null, index: number) => {
      setActionTabs((tabs) => {
        const shallowCopy = [...tabs]
        shallowCopy[index].form = form
        return shallowCopy
      })
    },
    [setActionTabs]
  )

  const saveWorkflow = React.useCallback(() => {
    if (!initTab) {
      throw new Error("Attempted to save invalid `InitSchema`.")
    }
    store.actions.saveWorkflow({
      uuid: uuid,
      init: initTab,
      actions: actionTabs
        .map((t) => t.form)
        .filter((f): f is ActionForm => Boolean(f)),
    })
    setUUID(uuidv4())
    setTabActive("-1")
    setInitTab(null)
    setActionTabs([])
  }, [
    store.actions,
    uuid,
    initTab,
    actionTabs,
    setUUID,
    setTabActive,
    setInitTab,
    setActionTabs,
  ])

  return (
    <Tabs
      key={uuid}
      className="flex flex-col h-full gap-4"
      value={tabActive}
      onValueChange={setTabActive}
    >
      <TabsList className="shrink-0 flex overflow-x-auto overflow-y-hidden scrollbar justify-start mt-2 mx-4">
        <TabsTrigger
          value="-1"
          disabled={store.lockedBy.size > 0}
          className={cn(
            tabValid(-1)
              ? ""
              : "text-destructive data-[state=active]:bg-destructive"
          )}
        >
          Start
        </TabsTrigger>
        {actionTabs.map((tab, index) => (
          <TabsTrigger
            key={tab.key}
            value={`${index}`}
            disabled={store.lockedBy.size > 0}
            className={cn(
              tabValid(index)
                ? ""
                : "text-destructive data-[state=active]:bg-destructive"
            )}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <InitTabPanel
        className="grow px-4 overflow-y-auto scrollbar"
        value="-1"
        defaultValues={initTab}
        onChange={setInitTab}
      />
      {actionTabs.map((tab, index) => (
        <ActionTabPanel
          key={tab.key}
          className="grow px-4 overflow-y-auto scrollbar"
          value={`${index}`}
          defaultValues={tab.form}
          params={tabParams(index)}
          onChange={(form) => tabUpdateForm(form, index)}
          onRemove={() => {
            setTabActive(`${index - (tabActiveLast ? 1 : 0)}`)
            setActionTabs((tabs) => {
              const spliced = [...tabs].toSpliced(index, 1)
              for (let i = index; i < spliced.length; ++i) {
                spliced[i].label = `Step ${i + 1}`
              }
              return spliced
            })
          }}
        />
      ))}

      <div className="flex border-t px-4 py-2">
        <Button
          onClick={() => {
            if (tabActiveLast) {
              setActionTabs((tabs) => [
                ...tabs,
                {
                  key: uuidv4(),
                  label: `Step ${actionTabs.length + 1}`,
                  form: null,
                },
              ])
            }
            setTabActive(`${tabActiveIndex + 1}`)
          }}
          disabled={
            store.lockedBy.size > 0 ||
            (tabActiveLast && !tabValid(tabActiveIndex))
          }
        >
          {tabActiveLast ? "New Step" : "Continue"}
        </Button>
        <Button
          variant="secondary"
          className="ml-auto"
          disabled={store.lockedBy.size > 0 || !tabValid(actionTabs.length - 1)}
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
