import type { ContentScriptContext } from "wxt/client"
import { TaskStatus } from "@/utils/workflow"
import {
  ReplayWorkflowStartMessage,
  type Response,
  addMessageListener,
} from "@/utils/messages"
import { Event } from "@/utils/event"
import { Runtime } from "wxt/browser"

const TRIGGER_REPLAY_ID = "fluidic-trigger-replay-button"

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

const replayWorkflow = async (
  payload: ReplayWorkflowStartMessage["payload"]
): Promise<Response<ReplayWorkflowStartMessage>> => {
  return {
    status: TaskStatus.SUCCEEDED,
    message: `Replay workflow {${JSON.stringify(payload)}}.`,
  }
}

const definition: ReturnType<typeof defineContentScript> = defineContentScript({
  matches: ["*://*/*"],

  main(_context: ContentScriptContext) {
    const launchReplayButton = document.querySelector(`#${TRIGGER_REPLAY_ID}`)
    launchReplayButton?.addEventListener("click", () => {
      chrome.runtime.sendMessage({
        event: Event.WORKFLOW_TRIGGER_QUERY,
        payload: null,
      })
    })

    addMessageListener((message, sender) => {
      console.debug("Internal Replay Runtime Message ", JSON.stringify(message))
      const { event, payload } = message

      switch (event) {
        case Event.REPLAY_CHECK: {
          return Promise.resolve(true)
        }
        case Event.WORKFLOW_TRIGGER_STOP:
        case Event.WORKFLOW_TRIGGER_QUERY: {
          return Promise.resolve(true)
        }
        case Event.WORKFLOW_TRIGGER_START: {
          return replayWorkflow(payload)
        }
        case Event.REPLAY_EXTRACTING_CLICK: {
          return replayExtractingClick(payload)
        }
        case Event.REPLAY_INJECTING: {
          return replayInjecting(payload)
        }
        case Event.REPLAY_RECORDING_CLICK: {
          return replayRecordingClick(payload)
        }
        case Event.REPLAY_RECORDING_KEYUP: {
          return replayRecordingKeyup(payload)
        }
      }
    })
  },
})

export default definition
