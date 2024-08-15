import axios from "axios"
import { Runtime } from "wxt/browser"

import { Workflow } from "@/utils/workflow"
import { Event } from "@/utils/event"

export const fetchWorkflow = async (tabURL: string): Promise<Workflow> => {
  // TODO: Support enqueue of multiple workflows
  const workflowIdsToEnqueue = new URL(tabURL).searchParams.getAll(
    "fluidicWorkflowIds[]"
  )
  const [workflowId] = workflowIdsToEnqueue.map((s) => String(s).trim())
  if (!workflowId) {
    throw new Error(
      "No workflowId found in tab url query params, url: " + tabURL
    )
  }

  // Query workflowId as Workflow
  // TODO: Replace with env-based api target OR propagate target in evt payload
  const response = await axios.get(
    `http://localhost:80/api/workflows/${workflowId}`
  )
  const workflow: Workflow = response.data
  if (!workflow) {
    throw new Error(`No workflow found for id ${workflowId} from response`)
  }

  return workflow
}

// Top-level background listener to init flows within content script inject components; must be in background.ts and async iife wrapped to avoid 'Error - user gesture required'
export const topLevelBackgroundMsgListener = <M extends Message>(
  message: M,
  sender?: Runtime.MessageSender
) => {
  ;(async () => {
    switch (message.event) {
      case Event.TRIGGER_WORKFLOW_CHECK: {
        const tab = sender?.tab
        const { id: tabId, windowId, url: tabURL } = sender?.tab ?? {}
        if (!tab || !tabId || !tabURL)
          throw new Error( // TRIGGER_WORKFLOW_QUERY should not be sent until landing page has loaded, button has been injected, and tapped to open extension
            `No tab id ${tabId} or tab url ${JSON.stringify(sender?.tab)} found from evt sender`
          )

        // Open side panel programatically — nesting or wrapping in any handler (without injecting a button from chrome runtime trigger by client) will lead to Error — user gesture required
        // @ts-ignore
        browser.sidePanel.open({ windowId })

        // Query workflow data and begin internal execution of steps sequentially
        const workflow = await fetchWorkflow(tabURL)
        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        })
        const anchorHeadlessTab = tabs.find((t) =>
          t.url?.includes("headless/home?fluidicWorkflowIds[]")
        )
        if (!anchorHeadlessTab || !anchorHeadlessTab.id)
          throw new Error(
            "No headless found from tabs query for URL headless/home?fluidicWorkflowIds[]"
          )
        await sendTab(anchorHeadlessTab.id, {
          event: Event.TRIGGER_WORKFLOW_START,
          payload: { workflow },
        })
        removeMessageListener(topLevelBackgroundMsgListener)
        return
      }
    }
  })()
}
