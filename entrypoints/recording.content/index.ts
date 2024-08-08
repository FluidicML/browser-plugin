// This content script is responsible for recording different user actions like
// clicks or key events. Messaging is used to toggle "recording mode" on and
// off.
//
// Rely on CSS when possible to account for vendor prefixes.

import "./styles.css"

import type { ContentScriptContext } from "wxt/client"
import { Event, addMessageListener, sendExt } from "@/utils/messages"
import { type FluidicElement, isFluidicElement } from "@/utils/dom"

const OUTLINE_PADDING = 15

export default defineContentScript({
  matches: ["*://*/*"],

  async main(_context: ContentScriptContext) {
    const outline = document.createElement("div")
    outline.id = "fluidic-recording-outline"
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
      document
        .querySelectorAll(".fluidic-not-allowed")
        .forEach((e) => e.classList.remove("fluidic-not-allowed"))

      const target = document.elementFromPoint(ev.clientX, ev.clientY)
      if (!isFluidicElement(target)) {
        target?.classList.add("fluidic-not-allowed")
        return
      }

      const bounds = target.getBoundingClientRect()
      forceStyle("top", `${bounds.top - OUTLINE_PADDING}px`)
      forceStyle("left", `${bounds.left - OUTLINE_PADDING}px`)
      forceStyle("width", `${bounds.width + 2 * OUTLINE_PADDING}px`)
      forceStyle("height", `${bounds.height + 2 * OUTLINE_PADDING}px`)
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
      const target = document.elementFromPoint(ev.clientX, ev.clientY)

      if (target?.classList.contains("fluidic-not-allowed")) {
        ev.stopImmediatePropagation()
        ev.preventDefault()
      }

      if (!isFluidicElement(target)) {
        console.warn("FLUIDIC", "Clicked non-HTML element.")
        return
      }

      sendExt({
        event: Event.RECORDING_CLICK,
        payload: { action: "click", selector: getSelector(target) },
      })
    }

    let lastKeyupTarget: FluidicElement | null = null

    const keyupListener = (ev: KeyboardEvent) => {
      const target = ev.target

      if (!isFluidicElement(target)) {
        console.warn("FLUIDIC", "Clicked non-HTML element.")
        return
      }

      sendExt({
        event: Event.RECORDING_KEYUP,
        payload: {
          action: "keyup",
          selector: getSelector(target),
          value: ev.key,
          replace: lastKeyupTarget === target,
        },
      })

      lastKeyupTarget = target
    }

    const recordingStart = () => {
      document.addEventListener("mousemove", moveListener, true)
      document.addEventListener("scroll", scrollListener, true)
      document.addEventListener("click", clickListener, true)
      document.addEventListener("keyup", keyupListener, true)
      outlineShow(true)
    }

    const recordingStop = () => {
      if (lastKeyupTarget) {
        lastKeyupTarget = null
      }
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId)
        scrollTimeoutId = null
      }
      outlineShow(false)
      document.removeEventListener("keyup", keyupListener, true)
      document.removeEventListener("click", clickListener, true)
      document.removeEventListener("scroll", scrollListener, true)
      document.removeEventListener("mousemove", moveListener, true)
    }

    addMessageListener((message) => {
      switch (message.event) {
        case Event.RECORDING_CHECK: {
          return Promise.resolve(true)
        }
        case Event.RECORDING_START: {
          recordingStop()
          recordingStart()
          break
        }
        case Event.RECORDING_STOP: {
          recordingStop()
          break
        }
      }
    })
  },
})
