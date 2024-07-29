import React from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { v4 as uuidv4 } from "uuid"

import type { Workflow } from "@/utils/workflow"

export type TabValue = "builder" | "library" | "runner"

export type SharedState = {
  activeTab: TabValue
  library: Workflow[]
  triggered: Workflow | null
  actions: {
    setActiveTab: (tab: TabValue) => void
    saveWorkflow: (workflow: Omit<Workflow, "uuid">) => void
    removeWorkflow: (workflow: Workflow) => void
    triggerWorkflow: (workflow: Workflow) => void
  }
}

export const useSharedStore = create<SharedState>()(
  persist(
    immer((set, get, _api) => ({
      activeTab: "builder",
      library: [],
      triggered: null,
      actions: {
        setActiveTab: (tab) => {
          set({ activeTab: tab })
        },
        saveWorkflow: (workflow) => {
          set((s) => {
            s.activeTab = "library"
            s.library.unshift({ ...workflow, uuid: uuidv4() })
          })
        },
        removeWorkflow: (workflow) => {
          const index = get().library.findIndex((w) => w.uuid === workflow.uuid)
          if (index === -1) {
            return
          }
          set((s) => {
            s.library.splice(index, 1)
            if (get().triggered?.uuid === workflow.uuid) {
              s.triggered = null
            }
          })
        },
        triggerWorkflow: (workflow) => {
          set({ activeTab: "runner", triggered: workflow })
        },
      },
    })),
    {
      name: "fluidic-workflows",

      partialize: (state) => ({ library: state.library }),

      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          const data = await browser.storage.sync.get(name)
          return data[name] ?? null
        },
        setItem: async (name: string, value: string) => {
          await browser.storage.sync.set({ [name]: value })
        },
        removeItem: (name: string) => {
          return browser.storage.sync.remove(name)
        },
      })),
    }
  )
)

export const useHydration = () => {
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const unsubHydrate = useSharedStore.persist.onHydrate(() =>
      setHydrated(false)
    )
    const unsubFinishHydration = useSharedStore.persist.onFinishHydration(() =>
      setHydrated(true)
    )

    setHydrated(useSharedStore.persist.hasHydrated())

    return () => {
      unsubHydrate()
      unsubFinishHydration()
    }
  }, [])

  return hydrated
}
