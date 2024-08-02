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
  REPLAY_EXTRACTING_CLICK = "REPLAY_EXTRACTING_CLICK",
  REPLAY_RECORDING_CLICK = "REPLAY_RECORDING_CLICK",
  REPLAY_RECORDING_KEYUP = "REPLAY_RECORDING_KEYUP",
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

export type ExtractingClickMessage = BaseMessage<
  MessageEvent.EXTRACTING_CLICK,
  Selector
>

export type ExtractingStartMessage = BaseMessage<MessageEvent.EXTRACTING_START>

export type ExtractingStopMessage = BaseMessage<MessageEvent.EXTRACTING_STOP>

export type RecordingClickMessage = BaseMessage<
  MessageEvent.RECORDING_CLICK,
  { action: "click"; selector: Selector }
>

export type RecordingKeyupMessage = BaseMessage<
  MessageEvent.RECORDING_KEYUP,
  { action: "keyup"; selector: Selector; value: string; replace: boolean }
>

export type RecordingQueryMessage = BaseMessage<
  MessageEvent.RECORDING_QUERY,
  null,
  boolean
>

export type RecordingStartMessage = BaseMessage<MessageEvent.RECORDING_START>

export type RecordingStopMessage = BaseMessage<MessageEvent.RECORDING_STOP>

export type ReplayExtractingClickMessage = BaseMessage<
  MessageEvent.REPLAY_EXTRACTING_CLICK,
  { selector: Selector },
  StepResult
>

export type ReplayRecordingClickMessage = BaseMessage<
  MessageEvent.REPLAY_RECORDING_CLICK,
  { selector: Selector },
  StepResult
>

export type ReplayRecordingKeyupMessage = BaseMessage<
  MessageEvent.REPLAY_RECORDING_KEYUP,
  { selector: Selector; value: string },
  StepResult
>

export type Message =
  | ExtractingClickMessage
  | ExtractingStartMessage
  | ExtractingStopMessage
  | RecordingClickMessage
  | RecordingKeyupMessage
  | RecordingQueryMessage
  | RecordingStartMessage
  | RecordingStopMessage
  | ReplayExtractingClickMessage
  | ReplayRecordingClickMessage
  | ReplayRecordingKeyupMessage

export type LiveMessage<M extends Message> = Omit<M, "response">

export const sendTab = <M extends Message>(
  tabId: number,
  message: LiveMessage<M>,
  options?: Runtime.SendMessageOptionsType
): Promise<M["response"]> => browser.tabs.sendMessage(tabId, message, options)

export const sendExt = <M extends Message>(
  message: LiveMessage<M>,
  options?: Runtime.SendMessageOptionsType
): Promise<M["response"]> => browser.runtime.sendMessage(message, options)

export const broadcastTabs = async <M extends Message>(
  message: LiveMessage<M>,
  options?: Runtime.SendMessageOptionsType
): Promise<
  {
    tab: number
    response: M["response"]
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
