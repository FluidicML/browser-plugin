import React from "react"
import { cn } from "@/utils/shadcn"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSharedStore } from "./store"
import { v4 as uuidv4 } from "uuid"

import {
  type InitSchema,
  Step,
  initSchema,
  stepSafeParse,
  stepParams,
} from "@/utils/schema"
import InitTabPanel from "./builder_tab/InitTabPanel"
import StepTabPanel from "./builder_tab/StepTabPanel"

type StepTab = {
  key: string
  step: Step | null
}

const BuilderTab = () => {
  const store = useSharedStore()

  const [uuid, setUUID] = React.useState(uuidv4())
  const [initTab, setInitTab] = React.useState<InitSchema | null>(null)
  const [stepTabs, setStepTabs] = React.useState<StepTab[]>([])

  React.useEffect(() => {
    if (store.libraryEditing === null) {
      return
    }
    setUUID(store.libraryEditing.uuid)
    setInitTab(store.libraryEditing.init)
    setStepTabs(
      store.libraryEditing.steps.map((step) => ({ key: uuidv4(), step }))
    )
    store.libraryActions.editWorkflow(null)
  }, [store.libraryEditing])

  const [tabActive, setTabActive] = React.useState("-1")
  // Retrieves the index of the active tab. For uniformity, the "init" tab is
  // treated as if it has index `-1` in the `actionTabs` array.
  const tabActiveIndex = parseInt(tabActive)
  // Checks if the active tab is also the last tab in the workflow.
  const tabActiveLast = tabActiveIndex === stepTabs.length - 1

  const tabParams = React.useCallback(
    (index: number) => {
      if (index < 0) {
        return new Set<string>()
      }
      const params = new Set<string>()
      for (let i = 0; i < Math.min(index, stepTabs.length); ++i) {
        const form = stepTabs[i].step
        if (form) {
          stepParams(form).forEach((p) => params.add(p))
        }
      }
      return params
    },
    [stepTabs]
  )

  const tabValid = React.useCallback(
    (index: number) => {
      if (index < 0) {
        return initTab !== null && initSchema.safeParse(initTab).success
      }
      for (let i = 0; i < Math.min(index + 1, stepTabs.length); ++i) {
        const form = stepTabs[i].step
        if (form === null || stepSafeParse(form)?.success !== true) {
          return false
        }
      }
      return true
    },
    [initTab, stepTabs]
  )

  const tabUpdateForm = React.useCallback(
    (form: Step | null, index: number) => {
      setStepTabs((tabs) => {
        const shallowCopy = [...tabs]
        shallowCopy[index].step = form
        return shallowCopy
      })
    },
    [setStepTabs]
  )

  const saveWorkflow = React.useCallback(() => {
    if (!initTab) {
      throw new Error("Attempted to save invalid `InitSchema`.")
    }
    store.libraryActions.saveWorkflow({
      uuid: uuid,
      init: initTab,
      steps: stepTabs.map((t) => t.step).filter((f): f is Step => Boolean(f)),
    })
    setUUID(uuidv4())
    setTabActive("-1")
    setInitTab(null)
    setStepTabs([])
  }, [
    store.libraryActions,
    uuid,
    initTab,
    stepTabs,
    setUUID,
    setTabActive,
    setInitTab,
    setStepTabs,
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
          disabled={store.sharedLockedBy.size > 0}
          className={cn(
            tabValid(-1)
              ? ""
              : "text-destructive data-[state=active]:bg-destructive"
          )}
        >
          Start
        </TabsTrigger>
        {stepTabs.map((tab, index) => (
          <TabsTrigger
            key={tab.key}
            value={`${index}`}
            disabled={store.sharedLockedBy.size > 0}
            className={cn(
              tabValid(index)
                ? ""
                : "text-destructive data-[state=active]:bg-destructive"
            )}
          >
            Step {index + 1}
          </TabsTrigger>
        ))}
      </TabsList>

      <InitTabPanel
        className="grow px-4 overflow-y-auto scrollbar"
        value="-1"
        defaultValues={initTab}
        onChange={setInitTab}
      />
      {stepTabs.map((tab, index) => (
        <StepTabPanel
          key={tab.key}
          className="grow px-4 overflow-y-auto scrollbar"
          value={`${index}`}
          defaultValues={tab.step}
          params={tabParams(index)}
          onChange={(form) => tabUpdateForm(form, index)}
          onRemove={() => {
            setTabActive(`${index - (tabActiveLast ? 1 : 0)}`)
            setStepTabs((tabs) => [...tabs].toSpliced(index, 1))
          }}
        />
      ))}

      <div className="flex border-t px-4 py-2">
        <Button
          onClick={() => {
            setStepTabs((tabs) =>
              tabs.toSpliced(tabActiveIndex + 1, 0, {
                key: uuidv4(),
                step: null,
              })
            )
            setTabActive(`${tabActiveIndex + 1}`)
          }}
          disabled={store.sharedLockedBy.size > 0}
        >
          New Step
        </Button>
        <Button
          variant="secondary"
          className="ml-auto"
          disabled={
            store.sharedLockedBy.size > 0 || !tabValid(stepTabs.length - 1)
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
