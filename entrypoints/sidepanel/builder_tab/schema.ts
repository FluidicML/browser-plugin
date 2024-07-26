import React from "react"
import { z } from "zod"

// The initial tab shown when building the workflow. Contains basic details
// all workflows must have.
export const initTabSchema = z
  .object({
    workflowName: z.string().min(1, {
      message: "You must provide a workflow name.",
    }),
    launchUrl: z.string().url({
      message: "You must provide a valid URL.",
    }),
  })
  .strict()
  .required()

export type InitTabSchema = z.infer<typeof initTabSchema>

// A recording feature. Triggering a capture means to start tracking discrete
// user events like mouse clicks or key presses. Each event is stored in a list
// for later replay.
export const actionCaptureSchema = z.object({}).strict().required()

export type ActionCaptureSchema = z.infer<typeof actionCaptureSchema>

// Navigates to the specified domain. In general, the action is considered
// complete as soon as the `DomContentLoaded` event fires. This means the
// actual contents of the page may not have finished rendering yet; you'll
// likely want to use a capture action or similar afterwards, which will wait
// for the specified selector to become available.
export const actionNavigateSchema = z
  .object({
    url: z.string().url({
      message: "You must provide a valid URL.",
    }),
    inNewTab: z.boolean({
      message:
        "You must indicate whether we should launch in a new tab or not.",
    }),
  })
  .strict()
  .required()

export type ActionNavigateSchema = z.infer<typeof actionNavigateSchema>

// Trigger a chat completion request to OpenAI. Responses are always structured
// as a `Record<string, string>` corresponding to the parsed JSON response.
// These values can then be accessed by all subsequent steps of the workflow.
export const actionPromptSchema = z
  .object({
    system: z.string().min(1, {
      message: "You must provide a system prompt.",
    }),
    user: z.string().min(1, {
      message: "You must provide a user prompt.",
    }),
  })
  .strict()
  .required()

export type ActionPromptSchema = z.infer<typeof actionPromptSchema>

// Tracks the persisted tabs. An workflow in progress is only maintained for
// the given session. Completed workflows are persisted indefinitely.

export enum ActionKind {
  CAPTURE = "capture",
  NAVIGATE = "navigate",
  PROMPT = "prompt",
}

export type ActionTab = {
  key: string
  label: string
  form?:
    | {
        kind: ActionKind.CAPTURE
        values: ActionCaptureSchema
      }
    | {
        kind: ActionKind.NAVIGATE
        values: ActionNavigateSchema
      }
    | {
        kind: ActionKind.PROMPT
        values: ActionPromptSchema
      }
}

export const safeParse = (form: NonNullable<ActionTab["form"]>) => {
  const kind = form.kind

  switch (kind) {
    case ActionKind.CAPTURE: {
      return actionCaptureSchema.safeParse(form.values)
    }
    case ActionKind.NAVIGATE: {
      return actionNavigateSchema.safeParse(form.values)
    }
    case ActionKind.PROMPT: {
      return actionPromptSchema.safeParse(form.values)
    }
    default: {
      const _exhaustivenessCheck: never = kind
      break
    }
  }

  return null
}
