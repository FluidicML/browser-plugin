import { browser, Runtime } from "wxt/browser"
import { Selector } from "./selector"
import { TaskResult, Workflow } from "./workflow"
import { Event } from "./event"

type BaseMessage<E extends Event, P = null> = {
  event: E
  payload: P
}

export type ExtractingCheckMessage = BaseMessage<Event.EXTRACTING_CHECK>
export type ExtractingClickMessage = BaseMessage<
  Event.EXTRACTING_CLICK,
  Selector
>
export type ExtractingQueryMessage = BaseMessage<Event.EXTRACTING_QUERY>
export type ExtractingStartMessage = BaseMessage<Event.EXTRACTING_START>
export type ExtractingStopMessage = BaseMessage<Event.EXTRACTING_STOP>

export type InjectingCheckMessage = BaseMessage<Event.INJECTING_CHECK>
export type InjectingClickMessage = BaseMessage<
  Event.INJECTING_CLICK,
  { param: string; index: number; selector: Selector }
>
export type InjectingQueryMessage = BaseMessage<Event.INJECTING_QUERY>
export type InjectingStartMessage = BaseMessage<
  Event.INJECTING_START,
  { param: string; index: number }
>
export type InjectingStopMessage = BaseMessage<Event.INJECTING_STOP>

export type RecordingCheckMessage = BaseMessage<Event.RECORDING_CHECK>
export type RecordingClickMessage = BaseMessage<
  Event.RECORDING_CLICK,
  { action: "click"; selector: Selector }
>
export type RecordingKeyupMessage = BaseMessage<
  Event.RECORDING_KEYUP,
  { action: "keyup"; selector: Selector; value: string; append: boolean }
>
export type RecordingQueryMessage = BaseMessage<Event.RECORDING_QUERY>
export type RecordingStartMessage = BaseMessage<Event.RECORDING_START>
export type RecordingStopMessage = BaseMessage<Event.RECORDING_STOP>

export type ReplayCheckMessage = BaseMessage<Event.REPLAY_CHECK>
export type ReplayExtractingClickMessage = BaseMessage<
  Event.REPLAY_EXTRACTING_CLICK,
  { name: string; selector: Selector; timeoutSecs: number }
>
export type ReplayInjectingMessage = BaseMessage<
  Event.REPLAY_INJECTING,
  { name: string; selector: Selector; value: string; timeoutSecs: number }
>
export type ReplayRecordingClickMessage = BaseMessage<
  Event.REPLAY_RECORDING_CLICK,
  { selector: Selector; timeoutSecs: number }
>
export type ReplayRecordingKeyupMessage = BaseMessage<
  Event.REPLAY_RECORDING_KEYUP,
  { selector: Selector; value: string; timeoutSecs: number }
>

export type ReplayWorkflowQueryMessage =
  BaseMessage<Event.WORKFLOW_TRIGGER_QUERY>
export type ReplayWorkflowStartMessage = BaseMessage<
  Event.WORKFLOW_TRIGGER_START,
  { workflow: Workflow }
>
export type ReplayWorkflowStopMessage = BaseMessage<Event.WORKFLOW_TRIGGER_STOP>

export type Message =
  | ExtractingCheckMessage
  | ExtractingClickMessage
  | ExtractingQueryMessage
  | ExtractingStartMessage
  | ExtractingStopMessage
  | InjectingCheckMessage
  | InjectingClickMessage
  | InjectingQueryMessage
  | InjectingStartMessage
  | InjectingStopMessage
  | RecordingCheckMessage
  | RecordingClickMessage
  | RecordingKeyupMessage
  | RecordingQueryMessage
  | RecordingStartMessage
  | RecordingStopMessage
  | ReplayCheckMessage
  | ReplayExtractingClickMessage
  | ReplayInjectingMessage
  | ReplayRecordingClickMessage
  | ReplayRecordingKeyupMessage
  | ReplayWorkflowQueryMessage
  | ReplayWorkflowStartMessage
  | ReplayWorkflowStopMessage

export type Response<M extends Message> = M extends
  | ExtractingQueryMessage
  | RecordingQueryMessage
  | ReplayWorkflowQueryMessage
  ? boolean
  : M extends InjectingQueryMessage
    ? InjectingStartMessage["payload"]
    : M extends
          | ReplayExtractingClickMessage
          | ReplayInjectingMessage
          | ReplayRecordingClickMessage
          | ReplayRecordingKeyupMessage
          | ReplayWorkflowStartMessage
      ? TaskResult
      : null

export const sendExt = <M extends Message>(
  message: M,
  options?: Runtime.SendMessageOptionsType
): Promise<Response<M>> => browser.runtime.sendMessage(message, options)

export const sendTab = async <M extends Message>(
  tabId: number,
  message: M,
  options?: Runtime.SendMessageOptionsType
): Promise<Response<M>> => browser.tabs.sendMessage(tabId, message, options)

// A type-safe representation of the types of messages we anticipate handling
// within the content scripts/extension.
export type MessageListener<M extends Message> = (
  message: M,
  sender?: Runtime.MessageSender
) => Promise<Response<M>> | true | void

export type ChromeMessageListener<M extends Message> = (
  message: M,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: Response<M>) => void
) => void

// If passing an async function, the listener will return a Promise for every
// message it receives, preventing other listeners from responding. If the
// listener should only respond to messages of a certain type, define the
// listener as a non-async function and return a Promise only for the messages
// the listener is meant to respond to. Otherwise return false or undefined.
// Refer to the following for details:
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
export const addMessageListener = <M extends Message>(
  listener: MessageListener<M>
): MessageListener<M> => {
  const wrapper: MessageListener<M> = (message, sender) => {
    // console.debug(
    //   "addMessageListener->wrapper: Message Received ",
    //   JSON.stringify(message),
    //   " From: ",
    //   sender
    // )
    if (
      typeof message === "object" &&
      Object.keys(Event).includes(message.event)
    ) {
      return listener(message, sender)
    }
  }
  browser.runtime.onMessage.addListener(wrapper)
  return wrapper
}

export const removeMessageListener = <M extends Message>(
  listener: MessageListener<M>
) => {
  return browser.runtime.onMessage.removeListener(listener)
}
