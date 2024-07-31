import { browser, Runtime } from "wxt/browser"

export enum MessageEvent {
  CAPTURE_CLICK = "CAPTURE_CLICK",
  CAPTURE_QUERY = "CAPTURE_QUERY",
  CAPTURE_START = "CAPTURE_START",
  CAPTURE_STOP = "CAPTURE_STOP",
}

type BaseMessage<
  Event extends MessageEvent,
  Payload = null,
  Response = null,
> = {
  event: Event
  payload: Payload
  response: Response // Exists solely for typing purposes. Do not use.
}

type CaptureClickMessage = BaseMessage<
  MessageEvent.CAPTURE_CLICK,
  { action: "click"; locator: Locator },
  null
>

type CaptureQueryMessage = BaseMessage<
  MessageEvent.CAPTURE_QUERY,
  null,
  boolean
>

type CaptureStartMessage = BaseMessage<MessageEvent.CAPTURE_START>
type CaptureStopMessage = BaseMessage<MessageEvent.CAPTURE_STOP>

export type Message =
  | CaptureClickMessage
  | CaptureQueryMessage
  | CaptureStartMessage
  | CaptureStopMessage

export const sendTab = (
  tabId: number,
  message: Omit<Message, "response">,
  options?: Runtime.SendMessageOptionsType
) => {
  return browser.tabs.sendMessage(tabId, message, options) as Promise<
    Message["response"]
  >
}

export const broadcastTabs = async (
  message: Omit<Message, "response">,
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
  message: Omit<Message, "response">,
  options?: Runtime.SendMessageOptionsType
) => {
  return browser.runtime.sendMessage(message, options) as Promise<
    Message["response"]
  >
}

// A type-safe representation of the types of messages we anticipate handling
// within the content scripts/extension.
type MessageListener = (
  message: Omit<Message, "response">,
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
