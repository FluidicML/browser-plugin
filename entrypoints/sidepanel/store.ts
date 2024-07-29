import React from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { v4 as uuidv4 } from "uuid"

import type { Workflow } from "@/utils/workflow"

export type SharedState = {
  library: Workflow[]
  actions: {
    saveWorkflow: (workflow: Omit<Workflow, "uuid">) => void
    removeWorkflow: (uuid: string) => void
  }
}

export const useSharedStore = create<SharedState>()(
  persist(
    immer((set, get, _api) => ({
      library: [],
      actions: {
        saveWorkflow: (workflow) => {
          set((s) => {
            s.library.unshift({ ...workflow, uuid: uuidv4() })
          })
        },
        removeWorkflow: (uuid) => {
          const index = get().library.findIndex((w) => w.uuid === uuid)
          if (index !== -1) {
            set((s) => {
              s.library.splice(index, 1)
            })
          }
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
