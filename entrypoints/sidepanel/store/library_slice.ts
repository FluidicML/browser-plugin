import type { Automation } from "@/utils/models"
import { type SharedStateCreator } from "./index"

export type LibrarySlice = {
  // A collection of locally saved scripts.
  librarySaved: Automation[]
  // The script being edited. This is set temporarily as a messaging mechanism.
  // The library tab sets it and the builder tab unsets it.
  libraryEditing: Automation | null

  libraryActions: {
    editAutomation: (auto: Automation | null) => void
    saveAutomation: (auto: Automation) => void
    removeAutomation: (auto: Automation) => void
  }
}

export const librarySlice: SharedStateCreator<LibrarySlice> = (set, get) => ({
  librarySaved: [],
  libraryEditing: null,

  libraryActions: {
    editAutomation: (script) => {
      set({
        sharedActiveTab: "builder",
        libraryEditing: script,
      })
    },

    saveAutomation: (script) => {
      const index = get().librarySaved.findIndex((w) => w.uuid === script.uuid)
      set((s) => {
        const lib =
          index === -1 ? s.librarySaved : s.librarySaved.toSpliced(index, 1)
        s.librarySaved = [script, ...lib]
        s.sharedActiveTab = "library"
      })
    },

    removeAutomation: (script) => {
      const index = get().librarySaved.findIndex((w) => w.uuid === script.uuid)
      if (index === -1) {
        return
      }
      set((s) => {
        s.librarySaved.splice(index, 1)
        if (get().runnerActive?.uuid === script.uuid) {
          s.runnerActive = null
        }
      })
    },
  },
})
