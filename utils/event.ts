export enum Event {
  // Checks if the extraction content script is loaded.
  EXTRACTING_CHECK = "EXTRACTING_CHECK",
  // Triggers on clicks while an extraction step is active.
  EXTRACTING_CLICK = "EXTRACTING_CLICK",
  // Queries for whether an extraction step is currently active.
  EXTRACTING_QUERY = "EXTRACTING_QUERY",
  // Indicates an extraction step was turned on.
  EXTRACTING_START = "EXTRACTING_START",
  // Indicates an extraction step was turned off.
  EXTRACTING_STOP = "EXTRACTING_STOP",
  // Checks if the injection content script is loaded.
  INJECTING_CHECK = "INJECTING_CHECK",
  // Triggers on clicks while an injection step is active.
  INJECTING_CLICK = "INJECTING_CLICK",
  // Queries for whether an injection step is currently active.
  INJECTING_QUERY = "INJECTING_QUERY",
  // Indicates an injection step was turned on.
  INJECTING_START = "INJECTING_START",
  // Indicates an injection step was turned off.
  INJECTING_STOP = "INJECTING_STOP",
  // Checks if the recording content script is loaded.
  RECORDING_CHECK = "RECORDING_CHECK",
  // Triggers on clicks while a recording step is active.
  RECORDING_CLICK = "RECORDING_CLICK",
  // Triggers on keyups while a recording step is active.
  RECORDING_KEYUP = "RECORDING_KEYUP",
  // Queries for whether a recording step is currently active.
  RECORDING_QUERY = "RECORDING_QUERY",
  // Indicates a recording step was turned on.
  RECORDING_START = "RECORDING_START",
  // Indicates a recording step was turned off.
  RECORDING_STOP = "RECORDING_STOP",
  // Checks if the replay content script is loaded.
  REPLAY_CHECK = "REPLAY_CHECK",
  // Sent on an extraction replay.
  REPLAY_EXTRACTING_CLICK = "REPLAY_EXTRACTING_CLICK",
  // Sent on an injection replay.
  REPLAY_INJECTING = "REPLAY_INJECTING",
  // Sent on a recording (click) replay.
  REPLAY_RECORDING_CLICK = "REPLAY_RECORDING_CLICK",
  // Sent on a recording (keyup) replay.
  REPLAY_RECORDING_KEYUP = "REPLAY_RECORDING_KEYUP",
  // Event sent from headless landing page with valid workflowIds to init workflow execution from workflow id provided in landing page URL query params.
  TRIGGER_WORKFLOW_START = "TRIGGER_WORKFLOW_START",
  // Clean up workflow trigger init listener and query workflow data from provided id to replay all steps.
  TRIGGER_WORKFLOW_QUERY = "TRIGGER_WORKFLOW_QUERY",
  // Check/ping content script on each trigger content script injection attempt.
  TRIGGER_WORKFLOW_CHECK = "TRIGGER_WORKFLOW_CHECK",
}
