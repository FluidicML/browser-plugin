import { browser, Runtime } from "wxt/browser"

export enum Event {
  EXTRACTING_CLICK = "EXTRACTING_CLICK",
  EXTRACTING_START = "EXTRACTING_START",
  EXTRACTING_STOP = "EXTRACTING_STOP",
  INJECTING_CLICK = "INJECTING_CLICK",
  INJECTING_START = "INJECTING_START",
  INJECTING_STOP = "INJECTING_STOP",
  RECORDING_CLICK = "RECORDING_CLICK",
  RECORDING_KEYUP = "RECORDING_KEYUP",
  RECORDING_QUERY = "RECORDING_QUERY",
  RECORDING_START = "RECORDING_START",
  RECORDING_STOP = "RECORDING_STOP",
  REPLAY_EXTRACTING_CLICK = "REPLAY_EXTRACTING_CLICK",
  REPLAY_INJECTING = "REPLAY_INJECTING",
  REPLAY_RECORDING_CLICK = "REPLAY_RECORDING_CLICK",
  REPLAY_RECORDING_KEYUP = "REPLAY_RECORDING_KEYUP",
}

type BaseMessage<E extends Event, P = null> = {
  event: E
  payload: P
}

export type ExtractingClickMessage = BaseMessage<
  Event.EXTRACTING_CLICK,
  Selector
>
export type ExtractingStartMessage = BaseMessage<Event.EXTRACTING_START>
export type ExtractingStopMessage = BaseMessage<Event.EXTRACTING_STOP>
export type InjectingClickMessage = BaseMessage<
  Event.INJECTING_CLICK,
  { param: string; index: number; selector: Selector }
>
export type InjectingStartMessage = BaseMessage<
  Event.INJECTING_START,
  { param: string; index: number }
>
export type InjectingStopMessage = BaseMessage<Event.INJECTING_STOP>
export type RecordingClickMessage = BaseMessage<
  Event.RECORDING_CLICK,
  { action: "click"; selector: Selector }
>
export type RecordingKeyupMessage = BaseMessage<
  Event.RECORDING_KEYUP,
  { action: "keyup"; selector: Selector; value: string; replace: boolean }
>
export type RecordingQueryMessage = BaseMessage<Event.RECORDING_QUERY>
export type RecordingStartMessage = BaseMessage<Event.RECORDING_START>
export type RecordingStopMessage = BaseMessage<Event.RECORDING_STOP>
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
  | ExtractingClickMessage
  | ExtractingStartMessage
  | ExtractingStopMessage
  | InjectingClickMessage
  | InjectingStartMessage
  | InjectingStopMessage
  | RecordingClickMessage
  | RecordingKeyupMessage
  | RecordingQueryMessage
  | RecordingStartMessage
  | RecordingStopMessage
  | ReplayExtractingClickMessage
  | ReplayInjectingMessage
  | ReplayRecordingClickMessage
  | ReplayRecordingKeyupMessage

// prettier-ignore
export type Response<M extends Message> =
    M extends RecordingQueryMessage
  ? boolean
  : M extends
      | ReplayExtractingClickMessage
      | ReplayInjectingMessage
      | ReplayRecordingClickMessage
      | ReplayRecordingKeyupMessage
  ? TaskResult
  : null

export const sendTab = <M extends Message>(
  tabId: number,
  message: M,
  options?: Runtime.SendMessageOptionsType
): Promise<Response<M>> => browser.tabs.sendMessage(tabId, message, options)

export const sendExt = <M extends Message>(
  message: M,
  options?: Runtime.SendMessageOptionsType
): Promise<Response<M>> => browser.runtime.sendMessage(message, options)

export const broadcastTabs = async <M extends Message>(
  message: M,
  options?: Runtime.SendMessageOptionsType
): Promise<
  {
    tab: number
    response: Response<M>
  }[]
> => {
  const allTabs = await browser.tabs.query({})
  const contentScriptMatches = new MatchPattern("*://*/*")
  const contentScriptTabs = allTabs.filter(
    (tab) =>
      tab.id != null &&
      tab.url != null &&
      contentScriptMatches.includes(tab.url)
  )

  const responses = await Promise.all(
    contentScriptTabs.map(async (tab) => {
      const response = await browser.tabs.sendMessage(tab.id!, message, options)
      return { tab: tab.id!, response }
    })
  )

  return responses
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
