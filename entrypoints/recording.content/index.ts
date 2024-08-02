// This content script is responsible for recording different user actions like
// clicks or key events. Messaging is used to toggle "recording mode" on and
// off.
//
// Rely on CSS when possible to account for vendor prefixes.

import "./styles.css"

import type { ContentScriptContext } from "wxt/client"
import { MessageEvent, addMessageListener, sendExt } from "@/utils/messages"

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
      const target = document.elementFromPoint(ev.clientX, ev.clientY)
      if (target instanceof HTMLElement) {
        const bounds = target.getBoundingClientRect()
        forceStyle("top", `${bounds.top - OUTLINE_PADDING}px`)
        forceStyle("left", `${bounds.left - OUTLINE_PADDING}px`)
        forceStyle("width", `${bounds.width + 2 * OUTLINE_PADDING}px`)
        forceStyle("height", `${bounds.height + 2 * OUTLINE_PADDING}px`)
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
      const target = document.elementFromPoint(ev.clientX, ev.clientY)
      if (!(target instanceof HTMLElement)) {
        console.warn("FLUIDIC", "Clicked on non-HTMLElement.")
        return
      }
      sendExt({
        event: MessageEvent.RECORDING_CLICK,
        payload: { action: "click", selector: getSelector(target) },
      })
    }

    let lastKeyupTarget: HTMLElement | null = null

    const keyupListener = (ev: KeyboardEvent) => {
      const target = ev.target
      if (!(target instanceof HTMLInputElement)) {
        return
      }
      sendExt({
        event: MessageEvent.RECORDING_KEYUP,
        payload: {
          action: "keyup",
          selector: getSelector(target),
          value: target instanceof HTMLInputElement ? target.value : ev.key,
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
        case MessageEvent.RECORDING_START: {
          recordingStart()
          break
        }
        case MessageEvent.RECORDING_STOP: {
          recordingStop()
          break
        }
      }
    })

    // On a new page load the content script is injected again. Check what
    // state we're in.
    try {
      const isRecording = await sendExt({
        event: MessageEvent.RECORDING_QUERY,
        payload: null,
      })
      if (isRecording) {
        recordingStart()
      }
    } catch (err) {
      // A communication error indicates the sidepanel isn't open; assume we
      // aren't recording when this happens.
    }
  },
})
