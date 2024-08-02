import React from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { v4 as uuidv4 } from "uuid"

import type { Workflow } from "@/utils/workflow"

// https://immerjs.github.io/immer/map-set
import { enableMapSet } from "immer"
enableMapSet()

export type TabValue = "builder" | "library" | "runner" | "settings"

export type SharedState = {
  // OpenAI API key used for any chat completions.
  openaiApiKey: string
  // Which tab of the sidepanel is selected.
  activeTab: TabValue

  // A non-empty value indicates the top-level tabbing should be disabled.
  lockedBy: Set<string>
  // A collection of locally saved workflows.
  library: Workflow[]
  // The workflow being run.
  triggered: Workflow | null

  actions: {
    lock: (locker: string) => void
    unlock: (locker: string) => void
    setOpenaiApiKey: (key: string) => void
    setActiveTab: (tab: TabValue) => void
    saveWorkflow: (workflow: Omit<Workflow, "uuid">) => void
    removeWorkflow: (workflow: Workflow) => void
    triggerWorkflow: (workflow: Workflow) => void
  }
}

export const useSharedStore = create<SharedState>()(
  persist(
    immer((set, get, _api) => ({
      openaiApiKey: "",
      activeTab: "builder",
      lockedBy: new Set(),
      library: [],
      triggered: null,

      actions: {
        lock: (locker: string) => {
          set((s) => {
            s.lockedBy.add(locker)
          })
        },

        unlock: (locker: string) => {
          set((s) => {
            s.lockedBy.delete(locker)
          })
        },

        setOpenaiApiKey: (key) => {
          set({ openaiApiKey: key })
        },

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

      partialize: (state) => ({
        openaiApiKey: state.openaiApiKey,
        library: state.library,
      }),

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
