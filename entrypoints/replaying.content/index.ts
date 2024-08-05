import type { ContentScriptContext } from "wxt/client"
import { Event, addMessageListener } from "@/utils/messages"

const TIMEOUT_MILLIS = 5_000

const replayExtractingClick = async (
  paramName: string,
  selector: Selector
): Promise<StepResult> => {
  const matches = await waitForSelector(selector, TIMEOUT_MILLIS)

  if (matches.length === 0) {
    return { success: false, messages: ["Could not find element."] }
  } else if (matches.length > 1) {
    return { success: false, messages: ["Too many matched elements."] }
  }

  const target = matches[0]

  return {
    success: true,
    messages: [`Extracted {${paramName}}.`],
    params: [[paramName, target.innerText]],
  }
}

const replayRecordingClick = async (
  selector: Selector
): Promise<StepResult> => {
  const matches = await waitForSelector(selector, TIMEOUT_MILLIS)

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
  const matches = await waitForSelector(selector, TIMEOUT_MILLIS)

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
        case Event.REPLAY_EXTRACTING_CLICK: {
          return replayExtractingClick(
            message.payload.name,
            message.payload.selector
          )
        }
        case Event.REPLAY_RECORDING_CLICK: {
          return replayRecordingClick(message.payload.selector)
        }
        case Event.REPLAY_RECORDING_KEYUP: {
          return replayRecordingKeyup(
            message.payload.selector,
            message.payload.value
          )
        }
      }
    })
  },
})
