import {
  type RecordingCheckMessage,
  Event,
  sendExt,
  sendTab,
} from "@/utils/messages"

type ContentScript = {
  css?: string
  js: string
  message: RecordingCheckMessage
}

const CONTENT_SCRIPTS: ContentScript[] = [
  {
    css: "content-scripts/recording.css",
    js: "content-scripts/recording.js",
    message: {
      event: Event.RECORDING_CHECK,
      payload: null,
    },
  },
]

const injectContentScripts = async (tabId: number) => {
  await Promise.all(
    CONTENT_SCRIPTS.map(async (script) => {
      try {
        await browser.tabs.sendMessage(tabId, script.message)
      } catch (e) {
        if (script.css) {
          await browser.scripting.insertCSS({
            files: [script.css],
            target: { tabId },
          })
        }
        await browser.scripting.executeScript({
          files: [script.js],
          target: { tabId },
        })
      }
    })
  )
}

const syncRecordingState = async (tabId: number) => {
  try {
    const isRecording = await sendExt({
      event: Event.RECORDING_QUERY,
      payload: null,
    })
    if (isRecording) {
      await sendTab(tabId, {
        event: Event.RECORDING_START,
        payload: null,
      })
    } else {
      await sendTab(tabId, {
        event: Event.RECORDING_STOP,
        payload: null,
      })
    }
  } catch (e) {
    await sendTab(tabId, {
      event: Event.RECORDING_STOP,
      payload: null,
    })
  }
}

const syncTab = async (tabId: number) => {
  await syncRecordingState(tabId)
}

export default defineBackground(() => {
  // https://github.com/wxt-dev/wxt/issues/570
  // @ts-ignore
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((e: any) => console.error("FLUIDIC", e))

  browser.tabs.onActivated.addListener(async (activeInfo) => {
    if (!activeInfo.tabId) {
      return
    }
    const tab = await browser.tabs.get(activeInfo.tabId)
    if (!tab || tab.status === "loading") {
      // Once the tab completes, content scripts will already exist. Let the
      // `onUpdated` listener handle the rest.
      return
    }
    await injectContentScripts(activeInfo.tabId)
    await syncTab(activeInfo.tabId)
  })

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (!tabId || changeInfo.status !== "complete") {
      return
    }
    const tab = await browser.tabs.get(tabId)
    if (tab.url?.startsWith("chrome://")) {
      return
    }
    await syncTab(tabId)
  })
})
