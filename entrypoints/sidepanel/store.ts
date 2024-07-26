import React from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

export type SharedState = {
  actions: {}
}

export const useSharedStore = create<SharedState>()(
  persist(
    immer((_set, _get, _api) => ({
      actions: {},
    })),
    {
      name: "fluidic-workflows",

      partialize: (_state) => ({}),

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
