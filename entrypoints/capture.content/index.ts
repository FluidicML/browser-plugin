// This content script is responsible for capturing different user actions like
// clicks or key events. Messaging is used to toggle "capture mode" on and off.
//
// Rely on CSS when possible to account for vendor prefixes.

import "./styles.css"

import type { ContentScriptContext } from "wxt/client"
import { buildLocator } from "@/utils/locator"
import { MessageEvent, addMessageListener, sendExt } from "@/utils/messages"

const OUTLINE_PADDING = 15

const forceStyle = (el: HTMLElement, key: string, value: string | null) => {
  el.style.setProperty(key, value, "important")
}

export default defineContentScript({
  matches: ["*://*/*"],

  main(_context: ContentScriptContext) {
    const outline = document.createElement("div")
    outline.id = "fluidic-outline"
    document.body.appendChild(outline)

    const outlineShow = (visible: boolean) => {
      forceStyle(outline, "display", visible ? "block" : "none")
    }

    // Renders the outline around the target element. Moving is a relatively
    // expensive operation, but other events (e.g. mouseover) didn't perform as
    // accurately.
    const moveListener = (ev: MouseEvent) => {
      const target = document.elementFromPoint(ev.clientX, ev.clientY)
      if (target instanceof HTMLElement) {
        const bounds = target.getBoundingClientRect()
        forceStyle(outline, "top", `${bounds.top - OUTLINE_PADDING}px`)
        forceStyle(outline, "left", `${bounds.left - OUTLINE_PADDING}px`)
        forceStyle(outline, "width", `${bounds.width + 2 * OUTLINE_PADDING}px`)
        forceStyle(
          outline,
          "height",
          `${bounds.height + 2 * OUTLINE_PADDING}px`
        )
      }
    }

    // Hides our outline when actively scrolling.
    let scrollTimeoutId: number | null = null

    const scrollListener = () => {
      outlineShow(false)
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId)
      }
      scrollTimeoutId = window.setTimeout(() => {
        forceStyle(outline, "width", "0px")
        forceStyle(outline, "height", "0px")
        outlineShow(true)
      }, 300)
    }

    const clickListener = (ev: MouseEvent) => {
      const target = document.elementFromPoint(ev.clientX, ev.clientY)
      if (target instanceof HTMLElement) {
        sendExt({
          event: MessageEvent.CAPTURE_CLICK,
          payload: buildLocator(target),
        })
      }
    }

    const captureStart = () => {
      document.addEventListener("mousemove", moveListener, true)
      document.addEventListener("scroll", scrollListener, true)
      document.addEventListener("click", clickListener, true)
      outlineShow(true)
    }

    const captureStop = () => {
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId)
        scrollTimeoutId = null
      }
      outlineShow(false)
      document.removeEventListener("click", clickListener, true)
      document.removeEventListener("scroll", scrollListener, true)
      document.removeEventListener("mousemove", moveListener, true)
    }

    addMessageListener((message) => {
      switch (message.event) {
        case MessageEvent.CAPTURE_START: {
          captureStart()
          break
        }
        case MessageEvent.CAPTURE_STOP: {
          captureStop()
          break
        }
      }
    })

    // On a new page load, the content script is injected again. Check what
    // state we're in.
    try {
      sendExt({
        event: MessageEvent.CAPTURE_QUERY,
        payload: null,
      }).then((isCapturing) => {
        if (isCapturing) {
          captureStart()
        }
      })
    } catch (err) {
      // A communication error indicates the sidepanel isn't open; assume we
      // aren't capturing when this happens.
    }
  },
})
