import type { ContentScriptContext } from "wxt/client"
import { MessageEvent, addMessageListener } from "@/utils/messages"

const replayExtractingClick = async (
  selector: Selector
): Promise<StepResult> => {
  return { success: true, messages: ["Extracted."] }
}

const replayRecordingClick = async (
  selector: Selector
): Promise<StepResult> => {
  const matches = findSelector(selector)

  if (matches.length === 0) {
    return { success: false, messages: ["Could not find element."] }
  } else if (matches.length > 1) {
    return { success: false, messages: ["Too many matched elements."] }
  }

  const target = matches[0]

  target.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true })
  )
  target.click()

  return { success: true, messages: ["Clicked."] }
}

const replayRecordingKeyup = async (
  selector: Selector,
  value: string
): Promise<StepResult> => {
  const matches = findSelector(selector)

  if (matches.length === 0) {
    return { success: false, messages: ["Could not find element."] }
  } else if (matches.length > 1) {
    return { success: false, messages: ["Too many matched elements."] }
  }

  const target = matches[0]

  for (const key of value) {
    target.dispatchEvent(
      new KeyboardEvent("keyup", {
        bubbles: true,
        cancelable: true,
        key,
      })
    )
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      target.value += key
    }
  }

  return { success: true, messages: ["Keyup."] }
}

export default defineContentScript({
  matches: ["*://*/*"],

  main(_context: ContentScriptContext) {
    addMessageListener((message) => {
      switch (message.event) {
        case MessageEvent.REPLAY_EXTRACTING_CLICK: {
          return replayExtractingClick(message.payload.selector)
        }
        case MessageEvent.REPLAY_RECORDING_CLICK: {
          return replayRecordingClick(message.payload.selector)
        }
        case MessageEvent.REPLAY_RECORDING_KEYUP: {
          return replayRecordingKeyup(
            message.payload.selector,
            message.payload.value
          )
        }
      }
    })
  },
})
