import { z } from "zod"

import { locatorSchema } from "@/utils/locator"

// The initial tab shown when building the workflow. Contains basic details
// all workflows must have.
export const initSchema = z
  .object({
    name: z.string().min(1, {
      message: "You must provide a workflow name.",
    }),
    url: z.string().url({
      message: "You must provide a valid URL.",
    }),
  })
  .required()

export type InitSchema = z.infer<typeof initSchema>

// A recording feature. Triggering a capture means to start tracking discrete
// user events like mouse clicks or key presses. Each event is stored in a list
// for later replay.

export const actionClickSchema = z
  .object({
    action: z.literal("click"),
    locator: locatorSchema,
  })
  .required()

export type ActionClickSchema = z.infer<typeof actionClickSchema>

export const actionKeyupSchema = z
  .object({
    action: z.literal("keyup"),
    locator: locatorSchema,
    value: z.string().min(1, {
      message: "You must provide a value.",
    }),
  })
  .required()

export type ActionKeyupSchema = z.infer<typeof actionKeyupSchema>

export const actionCaptureSchema = z
  .object({
    captures: z
      .array(
        z.discriminatedUnion("action", [actionClickSchema, actionKeyupSchema])
      )
      .nonempty(),
  })
  .required()

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
  })
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
    interpolations: z
      .array(
        z
          .object({
            name: z.string().min(1, {
              message: "You must provide a nonempty name.",
            }),
            description: z.string().min(1, {
              message: "You must provide a nonempty description.",
            }),
          })
          .required()
      )
      .optional(),
  })
  .required()

export type ActionPromptSchema = z.infer<typeof actionPromptSchema>

// Allow aggregating actions together. A workflow can consist of a sequence of
// any type of actions, though it must always start with an `init`.
export enum ActionKind {
  CAPTURE = "capture",
  NAVIGATE = "navigate",
  PROMPT = "prompt",
}

export type ActionForm =
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

export const actionFormSafeParse = (form: ActionForm) => {
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

// Representation of the entire workflow end-to-end.
export type Workflow = {
  uuid: string
  init: InitSchema
  actions: ActionForm[]
}
