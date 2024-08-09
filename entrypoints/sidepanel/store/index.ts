import React from "react"
import { type StateCreator, create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

import { type LibrarySlice, librarySlice } from "./library_slice"
import { type RunnerSlice, runnerSlice } from "./runner_slice"
import { type SettingsSlice, settingsSlice } from "./settings_slice"

// https://immerjs.github.io/immer/map-set
import { enableMapSet } from "immer"
enableMapSet()

export type TabValue = "builder" | "library" | "runner" | "settings"

type SharedSlice = {
  sharedActiveTab: TabValue
  // A non-empty value indicates the top-level tabbing should be disabled.
  sharedLockedBy: Set<string>

  sharedActions: {
    setActiveTab: (tab: TabValue) => void
    lock: (locker: string) => void
    unlock: (locker: string) => void
  }
}

export type SharedState = SharedSlice &
  LibrarySlice &
  RunnerSlice &
  SettingsSlice

export type SharedStateCreator<T> = StateCreator<
  SharedState,
  [["zustand/persist", unknown], ["zustand/immer", never], never],
  [],
  T
>

const sharedSlice: SharedStateCreator<SharedSlice> = (set) => ({
  sharedActiveTab: "builder",
  sharedLockedBy: new Set(),

  sharedActions: {
    lock: (locker: string) => {
      set((s) => {
        s.sharedLockedBy.add(locker)
      })
    },

    unlock: (locker: string) => {
      set((s) => {
        s.sharedLockedBy.delete(locker)
      })
    },

    setActiveTab: (tab) => {
      set({ sharedActiveTab: tab })
    },
  },
})

export const useSharedStore = create<SharedState>()(
  persist(
    immer((set, get, api) => ({
      ...sharedSlice(set, get, api),
      ...librarySlice(set, get, api),
      ...runnerSlice(set, get, api),
      ...settingsSlice(set, get, api),
    })),
    {
      name: "fluidic-workflows",

      partialize: (state) => ({
        librarySaved: state.librarySaved,
        settingsOpenAIKey: state.settingsOpenAIKey,
        settingsReplayTimeoutSecs: state.settingsReplayTimeoutSecs,
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
