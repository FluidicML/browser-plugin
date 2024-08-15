import type { ContentScriptContext } from "wxt/client"
import { TaskStatus } from "@/utils/workflow"
import {
  type Response,
  TriggerWorkflowStartMessage,
  addMessageListener,
  sendExt,
} from "@/utils/messages"
import { Event } from "@/utils/event"

const TRIGGER_REPLAY_ID = "fluidic-trigger-replay-button"
const TRIGGER_MIN_INIT_TIMEOUT = 2500

const replayWorkflow = async (
  payload: TriggerWorkflowStartMessage["payload"]
): Promise<Response<TriggerWorkflowStartMessage>> => {
  // Wait for main.tsx entrypoint App to load
  await waitForSelector(
    '[fluidic-react-app-loaded="true"]',
    TRIGGER_MIN_INIT_TIMEOUT
  )
  // Send event to trigger workflow via store sync
  await sendExt({
    event: Event.TRIGGER_WORKFLOW_START,
    payload,
  })

  // TODO(@morganhowell95): Handle error states

  return {
    status: TaskStatus.SUCCEEDED,
    message: `Triggered Replay workflow {${JSON.stringify(payload)}}.`,
  }
}

const definition: ReturnType<typeof defineContentScript> = defineContentScript({
  matches: ["*://*/*"], // TODO(@morganhowell95): Restrict to FluidicML Web App Headless Landing Page

  async main(_context: ContentScriptContext) {
    // If button for headless landing page exists, attach listener so ext may be launched
    const [launchReplayButton] = await waitForSelector(
      `#${TRIGGER_REPLAY_ID}`,
      TRIGGER_MIN_INIT_TIMEOUT
    )
    launchReplayButton?.addEventListener("click", () => {
      sendExt({
        event: Event.TRIGGER_WORKFLOW_CHECK,
        payload: null,
      })
    })

    addMessageListener((message, sender) => {
      const { event, payload } = message
      switch (event) {
        case Event.TRIGGER_WORKFLOW_CHECK: {
          return Promise.resolve(true)
        }
        case Event.TRIGGER_WORKFLOW_START: {
          return replayWorkflow(payload)
        }
      }
    })
  },
})

export default definition
