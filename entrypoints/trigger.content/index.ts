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
  // TODO(@morganhowell95): Implement auto workflow exec
  return {
    status: TaskStatus.SUCCEEDED,
    message: `Triggered Replay workflow {${JSON.stringify(payload)}}.`,
  }
}

const definition: ReturnType<typeof defineContentScript> = defineContentScript({
  matches: ["*://*/*"], // TODO(@morganhowell95): Restrict to FluidicML Web App Headless Landing Page

  async main(_context: ContentScriptContext) {
    // If button for headless landing page exists, attach listener so plugin may be launched
    // TODO(@morganhowell95): waitForSelector with timeout is safer than immediate querySelector below however need to refactor for top-level main async handling
    // const launchReplayButton = document.querySelector(`#${TRIGGER_REPLAY_ID}`)
    const [launchReplayButton] = await waitForSelector(
      `#${TRIGGER_REPLAY_ID}`,
      TRIGGER_MIN_INIT_TIMEOUT
    )
    launchReplayButton?.addEventListener("click", () => {
      //   chrome.runtime.sendMessage({
      //     event: Event.TRIGGER_WORKFLOW_CHECK,
      //     payload: null,
      //   })
      sendExt({
        event: Event.TRIGGER_WORKFLOW_CHECK,
        payload: null,
      })
    })

    addMessageListener((message, sender) => {
      console.debug(
        "Internal Trigger Runtime Message ",
        JSON.stringify(message)
      )
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
