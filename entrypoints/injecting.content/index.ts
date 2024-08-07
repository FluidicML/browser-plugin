// This content script is responsible for injecting values into elements on the
// page.

// Rely on CSS when possible to account for vendor prefixes.
import "./styles.css"

import type { ContentScriptContext } from "wxt/client"
import { Event, addMessageListener } from "@/utils/messages"

const OUTLINE_PADDING = 15

export default defineContentScript({
  matches: ["*://*/*"],

  main(_context: ContentScriptContext) {
    const outline = document.createElement("div")
    outline.id = "fluidic-extracting-outline"
    document.body.appendChild(outline)

    const forceStyle = (key: string, value: string | null) => {
      outline.style.setProperty(key, value, "important")
    }

    const outlineShow = (visible: boolean) => {
      forceStyle("display", visible ? "block" : "none")
    }

    // Renders the outline around the target element. Moving is a relatively
    // expensive operation, but other events (e.g. mouseover) didn't perform as
    // accurately.
    const moveListener = (ev: MouseEvent) => {
      forceStyle("pointer-events", "none")
      try {
        const target = document.elementFromPoint(ev.clientX, ev.clientY)
        if (target instanceof HTMLElement) {
          const bounds = target.getBoundingClientRect()
          forceStyle("top", `${bounds.top - OUTLINE_PADDING}px`)
          forceStyle("left", `${bounds.left - OUTLINE_PADDING}px`)
          forceStyle("width", `${bounds.width + 2 * OUTLINE_PADDING}px`)
          forceStyle("height", `${bounds.height + 2 * OUTLINE_PADDING}px`)
        }
      } finally {
        forceStyle("pointer-events", "auto")
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
        forceStyle("width", "0px")
        forceStyle("height", "0px")
        outlineShow(true)
      }, 300)
    }

    let active: { param: string; index: number } | null = null

    const clickListener = async (ev: MouseEvent) => {
      forceStyle("pointer-events", "none")
      try {
        const target = document.elementFromPoint(ev.clientX, ev.clientY)
        if (!(target instanceof HTMLElement)) {
          console.warn("FLUIDIC", "Clicked on non-HTMLElement.")
          return
        }
        if (active === null) {
          throw new Error("No parameter specified.")
        }
        sendExt({
          event: Event.INJECTING_CLICK,
          payload: {
            ...active,
            selector: getSelector(target),
          },
        })
      } finally {
        forceStyle("pointer-events", "auto")
      }
    }

    const injectingStart = (payload: { param: string; index: number }) => {
      active = payload
      document.addEventListener("mousemove", moveListener, true)
      document.addEventListener("scroll", scrollListener, true)
      document.addEventListener("click", clickListener, true)
      outlineShow(true)
    }

    const injectingStop = () => {
      outlineShow(false)
      document.removeEventListener("click", clickListener, true)
      document.removeEventListener("scroll", scrollListener, true)
      document.removeEventListener("mousemove", moveListener, true)
      active = null
    }

    addMessageListener((message) => {
      switch (message.event) {
        case Event.INJECTING_START: {
          injectingStart(message.payload)
          break
        }
        case Event.INJECTING_STOP: {
          injectingStop()
          break
        }
      }
    })
  },
})
