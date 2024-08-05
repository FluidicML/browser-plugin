import type { ContentScriptContext } from "wxt/client"
import { Event, type Response, addMessageListener } from "@/utils/messages"

const TIMEOUT_MILLIS = 5_000

const replayExtractingClick = async (
  payload: ReplayExtractingClickMessage["payload"]
): Promise<Response<ReplayExtractingClickMessage>> => {
  const matches = await waitForSelector(payload.selector, TIMEOUT_MILLIS)

  if (matches.length === 0) {
    return { success: false, messages: ["Could not find element."] }
  } else if (matches.length > 1) {
    return { success: false, messages: ["Too many matched elements."] }
  }

  const target = matches[0]

  return {
    success: true,
    messages: [`Extracted {${payload.name}}.`],
    params: [[payload.name, target.innerText]],
  }
}

const replayRecordingClick = async (
  payload: ReplayRecordingClickMessage["payload"]
): Promise<Response<ReplayRecordingClickMessage>> => {
  const matches = await waitForSelector(payload.selector, TIMEOUT_MILLIS)

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
  payload: ReplayRecordingKeyupMessage["payload"]
): Promise<Response<ReplayRecordingKeyupMessage>> => {
  const matches = await waitForSelector(payload.selector, TIMEOUT_MILLIS)

  if (matches.length === 0) {
    return { success: false, messages: ["Could not find element."] }
  } else if (matches.length > 1) {
    return { success: false, messages: ["Too many matched elements."] }
  }

  const target = matches[0]

  for (const key of payload.value) {
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
          return replayExtractingClick(message.payload)
        }
        case Event.REPLAY_RECORDING_CLICK: {
          return replayRecordingClick(message.payload)
        }
        case Event.REPLAY_RECORDING_KEYUP: {
          return replayRecordingKeyup(message.payload)
        }
      }
    })
  },
})
