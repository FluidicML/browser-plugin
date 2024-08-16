import { type SharedStateCreator } from "./index"
import { Model } from "@/utils/openai"

export type SettingsSlice = {
  // The OpenAI model to make chat completion requests with.
  settingsOpenAIModel: Model
  // OpenAI API key used when executing `OpenAI` steps.
  settingsOpenAIKey: string
  // The default timeout period when waiting for a selector or performing an
  // action on replay.
  settingsReplayTimeoutSecs: number

  settingsActions: {
    setOpenAIModel: (model: Model) => void
    setOpenAIKey: (key: string) => void
    setReplayTimeoutSecs: (timeout: number) => void
  }
}

export const settingsSlice: SharedStateCreator<SettingsSlice> = (set) => ({
  settingsOpenAIModel: Model.GPT_4O_MINI,
  settingsOpenAIKey: "",
  settingsReplayTimeoutSecs: 30,

  settingsActions: {
    setOpenAIModel: (model) => {
      set({ settingsOpenAIModel: model })
    },
    setOpenAIKey: (key) => {
      set({ settingsOpenAIKey: key })
    },
    setReplayTimeoutSecs: (timeout) => {
      set({ settingsReplayTimeoutSecs: timeout })
    },
  },
})
