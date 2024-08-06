import { type SharedStateCreator } from "./index"

export type SettingsSlice = {
  settingsOpenAIKey: string

  settingsActions: {
    setOpenaiApiKey: (key: string) => void
  }
}

export const settingsSlice: SharedStateCreator<SettingsSlice> = (set) => ({
  settingsOpenAIKey: "",

  settingsActions: {
    setOpenaiApiKey: (key) => {
      set({ settingsOpenAIKey: key })
    },
  },
})
