import { browser, Runtime } from "wxt/browser"

export enum MessageEvent {
  EXTRACTING_CLICK = "EXTRACTING_CLICK",
  EXTRACTING_START = "EXTRACTING_START",
  EXTRACTING_STOP = "EXTRACTING_STOP",
  RECORDING_CLICK = "RECORDING_CLICK",
  RECORDING_KEYUP = "RECORDING_KEYUP",
  RECORDING_QUERY = "RECORDING_QUERY",
  RECORDING_START = "RECORDING_START",
  RECORDING_STOP = "RECORDING_STOP",
}

type BaseMessage<
  Event extends MessageEvent,
  Payload = null,
  Response = null,
> = {
  event: Event
  payload: Payload
  response: Response // Exists solely for typing purposes.
}

type ExtractingClickMessage = BaseMessage<
  MessageEvent.EXTRACTING_CLICK,
  Selector
>
type ExtractingStartMessage = BaseMessage<MessageEvent.EXTRACTING_START>
type ExtractingStopMessage = BaseMessage<MessageEvent.EXTRACTING_STOP>

type RecordingClickMessage = BaseMessage<
  MessageEvent.RECORDING_CLICK,
  { action: "click"; selector: Selector }
>
type RecordingKeyupMessage = BaseMessage<
  MessageEvent.RECORDING_KEYUP,
  { action: "keyup"; selector: Selector; value: string; replace: boolean }
>
type RecordingQueryMessage = BaseMessage<
  MessageEvent.RECORDING_QUERY,
  null,
  boolean
>
type RecordingStartMessage = BaseMessage<MessageEvent.RECORDING_START>
type RecordingStopMessage = BaseMessage<MessageEvent.RECORDING_STOP>

export type Message =
  | ExtractingClickMessage
  | ExtractingStartMessage
  | ExtractingStopMessage
  | RecordingClickMessage
  | RecordingKeyupMessage
  | RecordingQueryMessage
  | RecordingStartMessage
  | RecordingStopMessage

export type LiveMessage =
  | Omit<ExtractingClickMessage, "response">
  | Omit<ExtractingStartMessage, "response">
  | Omit<ExtractingStopMessage, "response">
  | Omit<RecordingClickMessage, "response">
  | Omit<RecordingKeyupMessage, "response">
  | Omit<RecordingQueryMessage, "response">
  | Omit<RecordingStartMessage, "response">
  | Omit<RecordingStopMessage, "response">

export const sendTab = (
  tabId: number,
  message: LiveMessage,
  options?: Runtime.SendMessageOptionsType
) => {
  return browser.tabs.sendMessage(tabId, message, options) as Promise<
    Message["response"]
  >
}

export const broadcastTabs = async (
  message: LiveMessage,
  options?: Runtime.SendMessageOptionsType
) => {
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
      return { tab: tab.id, response }
    })
  )

  return responses
}

export const sendExt = (
  message: LiveMessage,
  options?: Runtime.SendMessageOptionsType
) => {
  return browser.runtime.sendMessage(message, options) as Promise<
    Message["response"]
  >
}

// A type-safe representation of the types of messages we anticipate handling
// within the content scripts/extension.
type MessageListener = (
  message: LiveMessage,
  sender?: Runtime.MessageSender,
  sendResponse?: () => void
) => Promise<any> | true | void

// If passing an async function, the listener will return a Promise for every
// message it receives, preventing other listeners from responding. If the
// listener should only respond to messages of a certain type, define the
// listener as a non-async function and return a Promise only for the messages
// the listener is meant to respond to. Otherwise return false or undefined.
// Refer to the following for details:
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
export const addMessageListener = (listener: MessageListener) => {
  const wrapper: MessageListener = (message, sender, sendResponse) => {
    if (
      typeof message === "object" &&
      Object.keys(MessageEvent).includes(message.event)
    ) {
      return listener(message, sender, sendResponse)
    }
  }
  browser.runtime.onMessage.addListener(wrapper)
  return wrapper
}

export const removeMessageListener = (listener: MessageListener) => {
  return browser.runtime.onMessage.removeListener(listener)
}
