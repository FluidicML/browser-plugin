// apps/fluidic-workflows/entrypoints/background.ts
import { Tabs } from "wxt/browser"

import {
  type ExtractingCheckMessage,
  type InjectingCheckMessage,
  type RecordingCheckMessage,
  sendExt,
  sendTab,
} from "@/utils/messages"
import { Event } from "@/utils/event"
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
    if (!isExtracting) throw new Error()

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

// const syncWorkflowTriggerState = async (tabId: number) => {
//   try {
//     const isTriggeringWorkflow = await sendExt({
//       event: Event.WORKFLOW_TRIGGER_QUERY,
//       payload: null,
//     })
//     console.warn("IS TRIGGERING WORKFLOW", JSON.stringify(isTriggeringWorkflow))
//     // if (!isTriggeringWorkflow) {
//     //   throw new Error()
//     // }
//     // await sendTab(tabId, {
//     //   event: Event.WORKFLOW_TRIGGER_START,
//     //   payload: { workflowId },
//     // })
//   } catch (e) {
//     console.error("ERRROR: ", JSON.stringify(e))
//     await sendTab(tabId, {
//       event: Event.WORKFLOW_TRIGGER_STOP,
//       payload: null,
//     })
//   }
//   // console.log("TAB URL", JSON.stringify(tab.url))
//   // if (
//   //   // Early exit if we are not deeplinking to an extension with fluidicWorkflowIds query param
//   //   !tab.url ||
//   //   // !tab.url.includes("chrome-extension://") ||
//   //   // !tab.url.includes("/sidepanel.html") ||
//   //   !tab.url.includes("?fluidicWorkflowIds[]=")
//   // )
//   //   return

//   // Otherwise parse workflowIds and query workflow for auto execution
//   // TODO(@morganhowell95): Support enqueue of multiple workflows
//   // const workflowIdsToEnqueue = new URL(tab.url).searchParams.getAll(
//   //   "fluidicWorkflowIds[]"
//   // )
//   // const [workflowId] = workflowIdsToEnqueue.map((s) => String(s).trim())
//   // if (!workflowId || !tab.id) return

//   // console.log(
//   //   "Launching workflow: ",
//   //   workflowId,
//   //   " from tab data: ",
//   //   JSON.stringify(tab)
//   // )
//   // await injectContentScripts(tab.id) // TODO(@morganhowell95): Ensure content scripts are not injected as duplicates

//   try {
//     console.debug("STARTING OPEN W WORKFLOW", JSON.stringify(workflowId))
//     // const tabs = await browser.tabs.query({ active: true, currentWindow: true })
//     // const [anchorTab] = tabs
//     // if (!anchorTab || !anchorTab.id)
//     //   throw Error("Could not find active tab to launch plugin.")

//     // Open sidepanel from button-triggered event broadcast and inject content scripts
//     // await injectContentScripts(anchorTab.id)
//     //@ts-ignore
//     // browser.sidePanel.open({
//     //   windowId: anchorTab.windowId,
//     // })
//     // // @ts-ignore
//     // browser.sidePanel.setOptions({
//     //   tabId: anchorTab.id,
//     //   windowId: anchorTab.windowId,
//     //   path: "sidepanel.html",
//     //   enabled: true,
//     // })

//     console.debug("DONE OPEN W WORKFLOW", JSON.stringify(workflowId))

//     // listener = addMessageListener<ReplayWorkflowMessage>((message) => {
//     //   console.debug("GOT A MESSAGE LOOK! ", message)
//     //   if (message.event === Event.WORKFLOW_TRIGGER_START) {
//     //     // @ts-ignore
//     //     browser.sidePanel.open({
//     //       windowId: tab.windowId,
//     //     })
//     //     // @ts-ignore
//     //     browser.sidePanel.setOptions({
//     //       tabId: tab.id,
//     //       windowId: tab.windowId,
//     //       path: "sidepanel.html",
//     //       enabled: true,
//     //     })
//     //   }
//     // })
//     // console.debug("LISTENER ADDED", JSON.stringify(listener))
//     // Open sidepanel within setTimeout->query handler instead of awaiting directly to avoid
//     // Error: `sidePanel.open()` may only be called in response to a user gesture.
//     // setTimeout(() => {
//     //   // browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
//     //   //   const targetWorkflowTriggerTab = tabs.find((t) => t.id === tab.id)
//     //   //   if (!targetWorkflowTriggerTab) throw Error("Could not find active tab.")
//     //   //   // @ts-ignore
//     //   //   browser.sidePanel.open({
//     //   //     windowId: targetWorkflowTriggerTab.windowId,
//     //   //   })
//     //   // })
//     //   // @ts-ignore
//     //   browser.sidePanel.open({
//     //     windowId: tab.windowId,
//     //   })
//     // }, 2500)

//     // chrome.sidePanel.open({ windowId: tab.windowId });
//     // .sidebarAction.setPanel({
//     //   tabId: tab.id,
//     //   windowId: tab.windowId,
//     //   panel: "sidepanel.html",
//     // })
//     // const workflow = await sendExt({
//     //   event: Event.WORKFLOW_TRIGGER_QUERY,
//     //   payload: { workflowId },
//     // })
//     // console.log("WORKFLOW QUERIED", JSON.stringify(workflowId))
//   } catch (e) {
//     throw e
//   } finally {
//     // await sendExt({
//     //   event: Event.WORKFLOW_TRIGGER_STOP,
//     //   payload: { workflowId },
//     // })
//   }
// }

const chromeRuntimeMessageListener = <T extends { event: Event }>(
  message: T,
  sender: chrome.runtime.MessageSender
) => {
  ;(async () => {
    switch (message.event) {
      case Event.WORKFLOW_TRIGGER_QUERY: {
        // console.debug(
        //   "RECEIVED WORKFLOW TRIGGER START",
        //   JSON.stringify(message)
        // )
        const { id: tabId, windowId, url: tabURL } = sender.tab ?? {}
        if (!tabId || !tabURL)
          throw new Error(
            `No tab id ${tabId} or tab url ${JSON.stringify(sender.tab)} found from evt sender`
          )

        // TODO(@morganhowell95): Support enqueue of multiple workflows
        const workflowIdsToEnqueue = new URL(tabURL).searchParams.getAll(
          "fluidicWorkflowIds[]"
        )
        const [workflowId] = workflowIdsToEnqueue.map((s) => String(s).trim())
        if (!workflowId)
          throw new Error(
            "No workflowId found in tab url query params, url: " + tabURL
          )

        // This will open the side panel programatically — nesting or wrapping in any handler with lead to Error — user gesture required
        // @ts-ignore
        chrome.sidePanel.open({ windowId })
        await chrome.sidePanel.setOptions({
          tabId,
          path: "sidepanel.html",
          enabled: true,
        })

        // Emit event to begin executing workflow
        await sendExt({
          event: Event.WORKFLOW_TRIGGER_START,
          payload: { workflowId },
        })

        // Clean up listener post-exec, should only execute once
        chrome.runtime.onMessage.removeListener(chromeRuntimeMessageListener)
        return
      }
    }
  })()
}

const syncTab = async (tab: Tabs.Tab) => {
  const { id: tabId } = tab
  if (!tabId)
    throw new Error("background->syncTab: tabId is undefined from Tabs.Tab")

  // TODO(@jrpotter): to confirm if these can run in parallel using Promise.all or Promise.allSettled to avoid latency
  await syncExtractingState(tabId)
  await syncInjectingState(tabId)
  await syncRecordingState(tabId)
  // await syncWorkflowTriggerState(tabId)
}

const onDefineBackground = async () => {
  // https://github.com/wxt-dev/wxt/issues/570
  // @ts-ignore
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((e: any) => console.error("FLUIDIC", e))

  browser.tabs.onActivated.addListener(async (activeInfo) => {
    if (!activeInfo.tabId) return
    const tab = await browser.tabs.get(activeInfo.tabId)
    if (!tab || tab.status === "loading" || !isSupportedTab(tab)) {
      // Once the tab completes, content scripts will already exist. Let the
      // `onUpdated` listener handle the rest.
      return
    }
    await injectContentScripts(activeInfo.tabId)
    await syncTab(tab)
  })

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (!tabId || changeInfo.status !== "complete") return
    if (!isSupportedTab(tab)) return
    await syncTab(tab)
  })

  // chrome.runtime.onMessage listeners must be set up in background service via top-level onDefineBackground;
  // onMessage/onMessageExternal is undefined in content scripts and within tab listeners above.
  chrome.runtime.onMessage.addListener(chromeRuntimeMessageListener)
}

export default defineBackground(onDefineBackground)
