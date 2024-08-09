import { type SharedStateCreator } from "./index"

export type SettingsSlice = {
  // OpenAI API key used when executing `OpenAI` steps.
  settingsOpenAIKey: string
  // The default timeout period when waiting for a selector or performing an
  // action on replay.
  settingsReplayTimeoutSecs: number

  settingsActions: {
    setOpenAIKey: (key: string) => void
    setReplayTimeoutSecs: (timeout: number) => void
  }
}

export const settingsSlice: SharedStateCreator<SettingsSlice> = (set) => ({
  settingsOpenAIKey: "",
  settingsReplayTimeoutSecs: 30,

  settingsActions: {
    setOpenAIKey: (key) => {
      set({ settingsOpenAIKey: key })
    },
    setReplayTimeoutSecs: (timeout) => {
      set({ settingsReplayTimeoutSecs: timeout })
    },
  },
})
