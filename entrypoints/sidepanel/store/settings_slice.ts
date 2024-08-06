import { type SharedStateCreator } from "./index"

export type SettingsSlice = {
  settingsOpenAIKey: string

  settingsActions: {
    setOpenAIKey: (key: string) => void
  }
}

export const settingsSlice: SharedStateCreator<SettingsSlice> = (set) => ({
  settingsOpenAIKey: "",

  settingsActions: {
    setOpenAIKey: (key) => {
      set({ settingsOpenAIKey: key })
    },
  },
})
