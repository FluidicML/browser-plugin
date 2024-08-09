import type { ContentScriptContext } from "wxt/client"
import { TaskStatus } from "@/utils/workflow"
import { Event, type Response, addMessageListener } from "@/utils/messages"

const replayExtractingClick = async (
  payload: ReplayExtractingClickMessage["payload"]
): Promise<Response<ReplayExtractingClickMessage>> => {
  const matches = await waitForSelector(payload.selector, payload.timeoutMillis)

  if (matches.length === 0) {
    return { status: TaskStatus.FAILED, message: "Could not find element." }
  } else if (matches.length > 1) {
    return { status: TaskStatus.FAILED, message: "Too many matched elements." }
  }

  const target = matches[0]

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return {
      status: TaskStatus.SUCCEEDED,
      message: `Extracted {${payload.name}}.`,
      params: [[payload.name, target.value]],
    }
  }

  if (target instanceof HTMLElement && target.innerText) {
    return {
      status: TaskStatus.SUCCEEDED,
      message: `Extracted {${payload.name}}.`,
      params: [[payload.name, target.innerText]],
    }
  }

  return {
    status: TaskStatus.FAILED,
    message: "Could not extract from element.",
  }
}

const replayInjecting = async (
  payload: ReplayInjectingMessage["payload"]
): Promise<Response<ReplayInjectingMessage>> => {
  const matches = await waitForSelector(payload.selector, payload.timeoutMillis)

  if (matches.length === 0) {
    return { status: TaskStatus.FAILED, message: "Could not find element." }
  } else if (matches.length > 1) {
    return { status: TaskStatus.FAILED, message: "Too many matched elements." }
  }

  const target = matches[0]

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    target.value = payload.value
    return {
      status: TaskStatus.SUCCEEDED,
      message: `Injected {${payload.name}}.`,
    }
  }

  if (target instanceof HTMLElement && target.isContentEditable) {
    target.innerText = payload.value
    return {
      status: TaskStatus.SUCCEEDED,
      message: `Injected {${payload.name}}.`,
    }
  }

  return {
    status: TaskStatus.FAILED,
    message: "Could not insert into element.",
  }
}

const replayRecordingClick = async (
  payload: ReplayRecordingClickMessage["payload"]
): Promise<Response<ReplayRecordingClickMessage>> => {
  const matches = await waitForSelector(payload.selector, payload.timeoutMillis)

  if (matches.length === 0) {
    return { status: TaskStatus.FAILED, message: "Could not find element." }
  } else if (matches.length > 1) {
    return { status: TaskStatus.FAILED, message: "Too many matched elements." }
  }

  const target = matches[0]
  target.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true })
  )

  return { status: TaskStatus.SUCCEEDED, message: "Clicked." }
}

const replayRecordingKeyup = async (
  payload: ReplayRecordingKeyupMessage["payload"]
): Promise<Response<ReplayRecordingKeyupMessage>> => {
  const matches = await waitForSelector(payload.selector, payload.timeoutMillis)

  if (matches.length === 0) {
    return { status: TaskStatus.FAILED, message: "Could not find element." }
  } else if (matches.length > 1) {
    return { status: TaskStatus.FAILED, message: "Too many matched elements." }
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

  return { status: TaskStatus.SUCCEEDED, message: "Keyup." }
}

const definition: ReturnType<typeof defineContentScript> = defineContentScript({
  matches: ["*://*/*"],

  main(_context: ContentScriptContext) {
    addMessageListener((message) => {
      switch (message.event) {
        case Event.REPLAY_CHECK: {
          return Promise.resolve(true)
        }
        case Event.REPLAY_EXTRACTING_CLICK: {
          return replayExtractingClick(message.payload)
        }
        case Event.REPLAY_INJECTING: {
          return replayInjecting(message.payload)
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

export default definition
