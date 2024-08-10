import type { ContentScriptContext } from "wxt/client"
import { TaskStatus } from "@/utils/workflow"
import { Event, type Response, addMessageListener } from "@/utils/messages"
import { StepKind } from "@/utils/schema"

const TIMEOUT_MILLIS = 5_000

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

const fetchAndExecuteWorkflow = async (workflowId: string): Promise<void> => {
  // TODO(@morganhowell95): Replace with remote api origin
  const response = await fetch(
    `http://localhost:80/api/workflows/${workflowId}`
  )
  const workflow: Workflow = await response.json()

  console.log(
    `Fetched workflow ${workflowId} with payload ${JSON.stringify(workflow)}`
  )

  // Execute the workflow
  for (const step of workflow.steps) {
    switch (step.kind) {
      case StepKind.EXTRACTING:
        for (const param of step.values.params) {
          await replayExtractingClick({
            name: param.name,
            selector: param.selector,
            timeoutMillis: TIMEOUT_MILLIS,
          })
        }
        break
      case StepKind.INJECTING:
        for (const target of step.values.targets) {
          await replayInjecting({
            name: target.name,
            selector: target.selector,
            value: "",
            timeoutMillis: TIMEOUT_MILLIS,
          })
        }
        break
      case StepKind.NAVIGATE:
        window.location.href = step.values.url
        break
      case StepKind.PROMPT:
        // Handle prompt
        break
      case StepKind.OPENAI:
        // Handle OpenAI step
        break
      case StepKind.RECORDING:
        for (const recording of step.values.recordings) {
          if (recording.action === "click") {
            await replayRecordingClick({
              selector: recording.selector,
              timeoutMillis: TIMEOUT_MILLIS,
            })
          } else if (recording.action === "keyup") {
            await replayRecordingKeyup({
              selector: recording.selector,
              value: recording.value,
              timeoutMillis: TIMEOUT_MILLIS,
            })
          }
        }
        break
    }
  }
}

const definition: ReturnType<typeof defineContentScript> = defineContentScript({
  matches: ["*://*/*"],

  main(_context: ContentScriptContext) {
    addMessageListener((message) => {
      switch (message.event) {
        case Event.DEEPLINK_WORKFLOW: {
          const workflowId: string = message.payload.workflowId
          fetchAndExecuteWorkflow(workflowId)
          break
        }
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
