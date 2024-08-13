import {
  type ExtractingCheckMessage,
  type InjectingCheckMessage,
  type RecordingCheckMessage,
  Event,
  sendExt,
  sendTab,
} from "@/utils/messages"
import { isSupportedTab } from "@/utils/browser_tabs"

// Tabs may not have our content script injected if they were already open
// before the plugin itself was installed. This array tracks the different
// content scripts we have available to us that need to be injected.
//
// As an alternative, we could have considered injecting scripts using some
// installation listener. This fails though for tabs that have been dormant for
// too long - their DOM needs to be reloaded which only happens when the user
// activates the tab.
//
// TODO: Add an assertion that all relevant scripts are included here.
type ContentScript = {
  css?: string
  js: string
  message:
    | ExtractingCheckMessage
    | InjectingCheckMessage
    | RecordingCheckMessage
    | ReplayCheckMessage
}

const CONTENT_SCRIPTS: ContentScript[] = [
  {
    css: "content-scripts/extracting.css",
    js: "content-scripts/extracting.js",
    message: {
      event: Event.EXTRACTING_CHECK,
      payload: null,
    },
  },
  {
    css: "content-scripts/injecting.css",
    js: "content-scripts/injecting.js",
    message: {
      event: Event.INJECTING_CHECK,
      payload: null,
    },
  },
  {
    css: "content-scripts/recording.css",
    js: "content-scripts/recording.js",
    message: {
      event: Event.RECORDING_CHECK,
      payload: null,
    },
  },
  {
    js: "content-scripts/replaying.js",
    message: {
      event: Event.REPLAY_CHECK,
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

const syncExtractingState = async (tabId: number) => {
  try {
    const isExtracting = await sendExt({
      event: Event.EXTRACTING_QUERY,
      payload: null,
    })
    if (!isExtracting) {
      throw new Error()
    }
    await sendTab(tabId, {
      event: Event.EXTRACTING_START,
      payload: null,
    })
  } catch (e) {
    await sendTab(tabId, {
      event: Event.EXTRACTING_STOP,
      payload: null,
    })
  }
}

const syncInjectingState = async (tabId: number) => {
  try {
    const injection = await sendExt({
      event: Event.INJECTING_QUERY,
      payload: null,
    })
    if (!injection) {
      throw new Error()
    }
    await sendTab(tabId, {
      event: Event.INJECTING_START,
      payload: injection,
    })
  } catch (e) {
    await sendTab(tabId, {
      event: Event.INJECTING_STOP,
      payload: null,
    })
  }
}

const syncRecordingState = async (tabId: number) => {
  try {
    const isRecording = await sendExt({
      event: Event.RECORDING_QUERY,
      payload: null,
    })
    if (!isRecording) {
      throw new Error()
    }
    await sendTab(tabId, {
      event: Event.RECORDING_START,
      payload: null,
    })
  } catch (e) {
    await sendTab(tabId, {
      event: Event.RECORDING_STOP,
      payload: null,
    })
  }
}

const syncTab = async (tabId: number) => {
  await syncExtractingState(tabId)
  await syncInjectingState(tabId)
  await syncRecordingState(tabId)
}

const definition: ReturnType<typeof defineBackground> = defineBackground(() => {
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
    if (!tab || tab.status === "loading" || !isSupportedTab(tab)) {
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
    if (!isSupportedTab(tab)) {
      return
    }
    await syncTab(tabId)
  })
})

export default definition
