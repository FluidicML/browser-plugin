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
export const stepExtractingSchema = z.object({
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

export type StepExtractingSchema = z.infer<typeof stepExtractingSchema>

// A recording feature. Triggering a recording means to start tracking discrete
// user events like mouse clicks or key presses. Each event is stored in a list
// for later replay.

export const stepClickSchema = z
  .object({
    action: z.literal("click"),
    selector: selectorSchema,
  })
  .required()

export type StepClickSchema = z.infer<typeof stepClickSchema>

export const stepKeyupSchema = z
  .object({
    action: z.literal("keyup"),
    selector: selectorSchema,
    value: z.string().min(1, {
      message: "You must provide a value.",
    }),
  })
  .required()

export type StepKeyupSchema = z.infer<typeof stepKeyupSchema>

export const stepRecordingSchema = z
  .object({
    recordings: z
      .array(
        z.intersection(
          z.discriminatedUnion("action", [stepClickSchema, stepKeyupSchema]),
          z.object({
            // Indicates the action can fail. Doing so does not stop execution.
            fallible: z.boolean().optional(),
            // Indicates the action requires confirmation before continuing.
            confirmed: z.boolean().optional(),
          })
        )
      )
      .nonempty(),
  })
  .required()

export type StepRecordingSchema = z.infer<typeof stepRecordingSchema>

// Navigates to the specified domain. In general, the step is considered
// complete as soon as the `DomContentLoaded` event fires. This means the
// actual contents of the page may not have finished rendering yet; you'll
// likely want to use a recording step or similar afterwards, which will wait
// for the specified selector to become available.
export const stepNavigateSchema = z
  .object({
    url: z.string().url({
      message: "You must provide a valid URL.",
    }),
  })
  .required()

export type StepNavigateSchema = z.infer<typeof stepNavigateSchema>

// Trigger a chat completion request to OpenAI. Responses are always structured
// as a `Record<string, string>` corresponding to the parsed JSON response.
// These values can then be accessed by all subsequent steps of the workflow.
export const stepOpenAISchema = z
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

export type StepOpenAISchema = z.infer<typeof stepOpenAISchema>

// Allow aggregating steps together. A workflow can consist of a sequence of
// any type of steps, though it must always start with an `init`.
export enum StepKind {
  EXTRACTING = "Extracting",
  NAVIGATE = "Navigate",
  OPENAI = "OpenAI",
  RECORDING = "Recording",
}

export type Step =
  | {
      kind: StepKind.EXTRACTING
      values: StepExtractingSchema
    }
  | {
      kind: StepKind.RECORDING
      values: StepRecordingSchema
    }
  | {
      kind: StepKind.NAVIGATE
      values: StepNavigateSchema
    }
  | {
      kind: StepKind.OPENAI
      values: StepOpenAISchema
    }

export const stepSafeParse = (step: Step) => {
  const kind = step.kind

  switch (kind) {
    case StepKind.EXTRACTING: {
      return stepExtractingSchema.safeParse(step.values)
    }
    case StepKind.RECORDING: {
      return stepRecordingSchema.safeParse(step.values)
    }
    case StepKind.NAVIGATE: {
      return stepNavigateSchema.safeParse(step.values)
    }
    case StepKind.OPENAI: {
      return stepOpenAISchema.safeParse(step.values)
    }
    default: {
      const _exhaustivenessCheck: never = kind
      return null
    }
  }
}

export const stepParams = (step: Step): string[] => {
  const kind = step.kind

  switch (kind) {
    case StepKind.EXTRACTING: {
      const parsed = stepExtractingSchema.safeParse(step.values)
      return parsed.success ? parsed.data.params.map((p) => p.name) : []
    }
    case StepKind.RECORDING: {
      return []
    }
    case StepKind.NAVIGATE: {
      return []
    }
    case StepKind.OPENAI: {
      const parsed = stepOpenAISchema.safeParse(step.values)
      return parsed.success ? parsed.data.params.map((p) => p.name) : []
    }
    default: {
      const _exhaustivenessCheck: never = kind
      return []
    }
  }
}
