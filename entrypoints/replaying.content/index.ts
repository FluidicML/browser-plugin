import type { ContentScriptContext } from "wxt/client"
import { MessageEvent, addMessageListener } from "@/utils/messages"

const replayClick = async (selector: Selector): Promise<StepResult> => {
  const matches = findSelector(selector)

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

  return { success: true, messages: [] }
}

const replayKeyup = async (
  selector: Selector,
  value: string
): Promise<StepResult> => {
  const matches = findSelector(selector)

  if (matches.length === 0) {
    return { success: false, messages: ["Could not find element."] }
  } else if (matches.length > 1) {
    return { success: false, messages: ["Too many matched elements."] }
  }

  const target = matches[0]

  for (const key of value) {
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

  return { success: true, messages: [] }
}

export default defineContentScript({
  matches: ["*://*/*"],

  main(_context: ContentScriptContext) {
    addMessageListener((message) => {
      switch (message.event) {
        case MessageEvent.REPLAYING_CLICK: {
          return replayClick(message.payload.selector)
        }
        case MessageEvent.REPLAYING_KEYUP: {
          return replayKeyup(message.payload.selector, message.payload.value)
        }
      }
    })
  },
})
