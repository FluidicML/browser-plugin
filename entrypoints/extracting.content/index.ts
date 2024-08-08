// This content script is responsible for extracting text from different
// elements on the page. Extracted text is then available in subsequent steps.

// Rely on CSS when possible to account for vendor prefixes.
import "./styles.css"

import type { ContentScriptContext } from "wxt/client"
import { Event, addMessageListener } from "@/utils/messages"
import { isFluidicElement } from "@/utils/dom"

const OUTLINE_PADDING = 15
const OUTLINE_ID = "fluidic-extracting-outline"
const OUTLINE_CLASS = "not-allowed"

export default defineContentScript({
  matches: ["*://*/*"],

  main(_context: ContentScriptContext) {
    const outline = document.createElement("div")
    outline.id = OUTLINE_ID
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
      outline.classList.add(OUTLINE_CLASS)

      try {
        const target = document.elementFromPoint(ev.clientX, ev.clientY)
        if (!isFluidicElement(target)) {
          return
        }

        const bounds = target.getBoundingClientRect()
        forceStyle("top", `${bounds.top - OUTLINE_PADDING}px`)
        forceStyle("left", `${bounds.left - OUTLINE_PADDING}px`)
        forceStyle("width", `${bounds.width + 2 * OUTLINE_PADDING}px`)
        forceStyle("height", `${bounds.height + 2 * OUTLINE_PADDING}px`)

        if (target.innerText) {
          outline.classList.remove(OUTLINE_CLASS)
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

    const clickListener = (ev: MouseEvent) => {
      if (outline.classList.contains(OUTLINE_CLASS)) {
        return
      }

      forceStyle("pointer-events", "none")
      try {
        const target = document.elementFromPoint(ev.clientX, ev.clientY)

        if (!isFluidicElement(target)) {
          console.warn("FLUIDIC", "Clicked non-HTML element.")
          return
        }

        sendExt({
          event: Event.EXTRACTING_CLICK,
          payload: getSelector(target),
        })
      } finally {
        forceStyle("pointer-events", "auto")
      }
    }

    const extractingStart = () => {
      document.addEventListener("mousemove", moveListener, true)
      document.addEventListener("scroll", scrollListener, true)
      document.addEventListener("click", clickListener, true)
      outlineShow(true)
    }

    const extractingStop = () => {
      outlineShow(false)
      document.removeEventListener("click", clickListener, true)
      document.removeEventListener("scroll", scrollListener, true)
      document.removeEventListener("mousemove", moveListener, true)
    }

    addMessageListener((message) => {
      switch (message.event) {
        case Event.EXTRACTING_CHECK: {
          return Promise.resolve(true)
        }
        case Event.EXTRACTING_START: {
          extractingStop()
          extractingStart()
          break
        }
        case Event.EXTRACTING_STOP: {
          extractingStop()
          break
        }
      }
    })
  },
})
