import "./style.css"

import type { ContentScriptContext } from "wxt/client"

// This content script is responsible for capturing different user actions like
// clicks or key events. Messaging is used to toggle "capture mode" on and off.

export default defineContentScript({
  matches: ["*://*/*"],

  main(_context: ContentScriptContext) {
    let hoverEl: HTMLElement | null = null

    const unhighlightHover = () => {
      if (hoverEl === null) {
        return
      }
      delete hoverEl.dataset.fluidic_outline
      hoverEl = null
    }

    const highlightHover = (ev: MouseEvent) => {
      if (!(ev.target instanceof HTMLElement)) {
        return
      }
      if (hoverEl !== ev.target) {
        unhighlightHover()
      }
      ev.target.dataset.fluidic_outline = ""
      console.log(ev.target)
      hoverEl = ev.target
    }

    browser.runtime.onMessage.addListener(async (message) => {
      if (typeof message !== "object" || message?.event === undefined) {
        return
      }
      switch (message.event) {
        case "start-capture": {
          document.addEventListener("mouseover", highlightHover)
          break
        }
        case "stop-capture": {
          unhighlightHover()
          document.removeEventListener("mouseover", highlightHover)
          break
        }
        default: {
          break
        }
      }
    })
  },
})
