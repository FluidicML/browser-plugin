import { z } from "zod"

import { selectorSchema } from "@/utils/selector"

// The initial tab shown when building the workflow. Contains basic details
// all workflows must have.
export const initSchema = z
  .object({
    name: z.string().min(1, {
      message: "You must provide a workflow name.",
    }),
  })
  .required()

export type InitSchema = z.infer<typeof initSchema>

// An extraction feature. Allows pulling the contents of elements out in a
// general way for interpolation into subsequent steps.
export const actionExtractingSchema = z.object({
  params: z
    .array(
      z.object({
        name: z.string().min(1, {
          message: "You must provide a valid name.",
        }),
        selector: selectorSchema,
      })
    )
    .nonempty(),
})

export type ActionExtractingSchema = z.infer<typeof actionExtractingSchema>

// A recording feature. Triggering a recording means to start tracking discrete
// user events like mouse clicks or key presses. Each event is stored in a list
// for later replay.

export const actionClickSchema = z
  .object({
    action: z.literal("click"),
    selector: selectorSchema,
  })
  .required()

export type ActionClickSchema = z.infer<typeof actionClickSchema>

export const actionKeyupSchema = z
  .object({
    action: z.literal("keyup"),
    selector: selectorSchema,
    value: z.string().min(1, {
      message: "You must provide a value.",
    }),
  })
  .required()

export type ActionKeyupSchema = z.infer<typeof actionKeyupSchema>

export const actionRecordingSchema = z
  .object({
    recordings: z
      .array(
        z.discriminatedUnion("action", [actionClickSchema, actionKeyupSchema])
      )
      .nonempty(),
  })
  .required()

export type ActionRecordingSchema = z.infer<typeof actionRecordingSchema>

// Navigates to the specified domain. In general, the action is considered
// complete as soon as the `DomContentLoaded` event fires. This means the
// actual contents of the page may not have finished rendering yet; you'll
// likely want to use a recording action or similar afterwards, which will wait
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
export const actionOpenAISchema = z
  .object({
    system: z.string().min(1, {
      message: "You must provide a system prompt.",
    }),
    user: z.string().min(1, {
      message: "You must provide a user prompt.",
    }),
    params: z
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

export type ActionOpenAISchema = z.infer<typeof actionOpenAISchema>

// Allow aggregating actions together. A workflow can consist of a sequence of
// any type of actions, though it must always start with an `init`.
export enum ActionKind {
  EXTRACTING = "Extracting",
  NAVIGATE = "Navigate",
  OPENAI = "OpenAI",
  RECORDING = "Recording",
}

export type ActionForm =
  | {
      kind: ActionKind.EXTRACTING
      values: ActionExtractingSchema
    }
  | {
      kind: ActionKind.RECORDING
      values: ActionRecordingSchema
    }
  | {
      kind: ActionKind.NAVIGATE
      values: ActionNavigateSchema
    }
  | {
      kind: ActionKind.OPENAI
      values: ActionOpenAISchema
    }

export const actionFormSafeParse = (form: ActionForm) => {
  const kind = form.kind

  switch (kind) {
    case ActionKind.EXTRACTING: {
      return actionExtractingSchema.safeParse(form.values)
    }
    case ActionKind.RECORDING: {
      return actionRecordingSchema.safeParse(form.values)
    }
    case ActionKind.NAVIGATE: {
      return actionNavigateSchema.safeParse(form.values)
    }
    case ActionKind.OPENAI: {
      return actionOpenAISchema.safeParse(form.values)
    }
    default: {
      const _exhaustivenessCheck: never = kind
      return null
    }
  }
}

export const actionFormParams = (form: ActionForm): string[] => {
  const kind = form.kind

  switch (kind) {
    case ActionKind.EXTRACTING: {
      const parsed = actionExtractingSchema.safeParse(form.values)
      return parsed.success ? parsed.data.params.map((ex) => ex.name) : []
    }
    case ActionKind.RECORDING: {
      return []
    }
    case ActionKind.NAVIGATE: {
      return []
    }
    case ActionKind.OPENAI: {
      const parsed = actionOpenAISchema.safeParse(form.values)
      return parsed.success ? parsed.data.params.map((i) => i.name) : []
    }
    default: {
      const _exhaustivenessCheck: never = kind
      return []
    }
  }
}
