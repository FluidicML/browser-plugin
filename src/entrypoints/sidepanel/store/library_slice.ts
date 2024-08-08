import type { Workflow } from "$/utils/workflow"
import { type SharedStateCreator } from "./index"

export type LibrarySlice = {
  // A collection of locally saved workflows.
  librarySaved: Workflow[]
  // The workflow being edited. This is set temporarily as a messaging
  // mechanism. The library tab sets it and the builder tab unsets it.
  libraryEditing: Workflow | null

  libraryActions: {
    editWorkflow: (workflow: Workflow | null) => void
    saveWorkflow: (workflow: Workflow) => void
    removeWorkflow: (workflow: Workflow) => void
  }
}

export const librarySlice: SharedStateCreator<LibrarySlice> = (set, get) => ({
  librarySaved: [],
  libraryEditing: null,

  libraryActions: {
    editWorkflow: (workflow) => {
      set({
        sharedActiveTab: "builder",
        libraryEditing: workflow,
      })
    },

    saveWorkflow: (workflow) => {
      const index = get().librarySaved.findIndex(
        (w) => w.uuid === workflow.uuid
      )
      set((s) => {
        const lib =
          index === -1 ? s.librarySaved : s.librarySaved.toSpliced(index, 1)
        s.librarySaved = [workflow, ...lib]
        s.sharedActiveTab = "library"
      })
    },

    removeWorkflow: (workflow) => {
      const index = get().librarySaved.findIndex(
        (w) => w.uuid === workflow.uuid
      )
      if (index === -1) {
        return
      }
      set((s) => {
        s.librarySaved.splice(index, 1)
        if (get().runnerActive?.uuid === workflow.uuid) {
          s.runnerActive = null
        }
      })
    },
  },
})
