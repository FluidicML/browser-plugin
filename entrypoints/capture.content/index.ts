import type { ContentScriptContext } from "wxt/client"

// This content script is responsible for capturing different user actions like
// clicks or key events. Messaging is used to toggle "capture mode" on and off.

export default defineContentScript({
  matches: ["*://*/*"],

  main(context: ContentScriptContext) {
    browser.runtime.onMessage.addListener(async (message) => {
      console.log("Content script recieved message:", message)
      return Math.random()
    })
  },
})
