import { browser, Runtime } from "wxt/browser"
import { isSupportedTab } from "./browser_tabs"

export enum Event {
  // Checks if the extraction content script is loaded.
  EXTRACTING_CHECK = "EXTRACTING_CHECK",
  // Triggers on clicks while an extraction step is active.
  EXTRACTING_CLICK = "EXTRACTING_CLICK",
  // Queries for whether an extraction step is currently active.
  EXTRACTING_QUERY = "EXTRACTING_QUERY",
  // Indicates an extraction step was turned on.
  EXTRACTING_START = "EXTRACTING_START",
  // Indicates an extraction step was turned off.
  EXTRACTING_STOP = "EXTRACTING_STOP",
  // Checks if the injection content script is loaded.
  INJECTING_CHECK = "INJECTING_CHECK",
  // Triggers on clicks while an injection step is active.
  INJECTING_CLICK = "INJECTING_CLICK",
  // Queries for whether an injection step is currently active.
  INJECTING_QUERY = "INJECTING_QUERY",
  // Indicates an injection step was turned on.
  INJECTING_START = "INJECTING_START",
  // Indicates an injection step was turned off.
  INJECTING_STOP = "INJECTING_STOP",
  // Checks if the recording content script is loaded.
  RECORDING_CHECK = "RECORDING_CHECK",
  // Triggers on clicks while a recording step is active.
  RECORDING_CLICK = "RECORDING_CLICK",
  // Triggers on keyups while a recording step is active.
  RECORDING_KEYUP = "RECORDING_KEYUP",
  // Queries for whether a recording step is currently active.
  RECORDING_QUERY = "RECORDING_QUERY",
  // Indicates a recording step was turned on.
  RECORDING_START = "RECORDING_START",
  // Indicates a recording step was turned off.
  RECORDING_STOP = "RECORDING_STOP",
  // Checks if the replay content script is loaded.
  REPLAY_CHECK = "REPLAY_CHECK",
  // Sent on an extraction replay.
  REPLAY_EXTRACTING_CLICK = "REPLAY_EXTRACTING_CLICK",
  // Sent on an injection replay.
  REPLAY_INJECTING = "REPLAY_INJECTING",
  // Sent on a recording (click) replay.
  REPLAY_RECORDING_CLICK = "REPLAY_RECORDING_CLICK",
  // Sent on a recording (keyup) replay.
  REPLAY_RECORDING_KEYUP = "REPLAY_RECORDING_KEYUP",
}

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
  { name: string; selector: Selector }
>
export type ReplayInjectingMessage = BaseMessage<
  Event.REPLAY_INJECTING,
  { name: string; selector: Selector; value: string }
>
export type ReplayRecordingClickMessage = BaseMessage<
  Event.REPLAY_RECORDING_CLICK,
  { selector: Selector }
>
export type ReplayRecordingKeyupMessage = BaseMessage<
  Event.REPLAY_RECORDING_KEYUP,
  { selector: Selector; value: string }
>

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

export type Response<M extends Message> = M extends
  | ExtractingQueryMessage
  | RecordingQueryMessage
  ? boolean
  : M extends InjectingQueryMessage
    ? InjectingStartMessage["payload"]
    : M extends
          | ReplayExtractingClickMessage
          | ReplayInjectingMessage
          | ReplayRecordingClickMessage
          | ReplayRecordingKeyupMessage
      ? TaskResult
      : null

export const sendExt = <M extends Message>(
  message: M,
  options?: Runtime.SendMessageOptionsType
): Promise<Response<M>> => browser.runtime.sendMessage(message, options)

export const sendTab = async <M extends Message>(
  tabId: number | null,
  message: M,
  options?: Runtime.SendMessageOptionsType
): Promise<Response<M>> => {
  if (tabId !== null) {
    return await browser.tabs.sendMessage(tabId, message, options)
  }
  for (const tab of await queryTabs({ active: true, currentWindow: true })) {
    if (tab.id && isSupportedTab(tab)) {
      return await browser.tabs.sendMessage(tab.id, message, options)
    }
  }
  throw new Error("Could not find active tab.")
}

// A type-safe representation of the types of messages we anticipate handling
// within the content scripts/extension.
type MessageListener<M extends Message> = (
  message: M,
  sender?: Runtime.MessageSender
) => Promise<Response<M>> | true | void

// If passing an async function, the listener will return a Promise for every
// message it receives, preventing other listeners from responding. If the
// listener should only respond to messages of a certain type, define the
// listener as a non-async function and return a Promise only for the messages
// the listener is meant to respond to. Otherwise return false or undefined.
// Refer to the following for details:
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
export const addMessageListener = <M extends Message>(
  listener: MessageListener<M>
) => {
  const wrapper: MessageListener<M> = (message, sender) => {
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
