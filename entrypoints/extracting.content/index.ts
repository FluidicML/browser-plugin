// This content script is responsible for extracting text from different
// elements on the page. Extracted text is then available in subsequent steps.
//
// Rely on CSS when possible to account for vendor prefixes.

import "./styles.css"

import type { ContentScriptContext } from "wxt/client"

const OUTLINE_PADDING = 15

const forceStyle = (el: HTMLElement, key: string, value: string | null) => {
  el.style.setProperty(key, value, "important")
}

export default defineContentScript({
  matches: ["*://*/*"],

  main(_context: ContentScriptContext) {
    const outline = document.createElement("div")
    outline.id = "fluidic-extracting-outline"
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

    const extractingStart = () => {
      document.addEventListener("mousemove", moveListener, true)
      document.addEventListener("scroll", scrollListener, true)
      outlineShow(true)
    }

    const extractingStop = () => {
      outlineShow(false)
      document.removeEventListener("scroll", scrollListener, true)
      document.removeEventListener("mousemove", moveListener, true)
    }
  },
})
