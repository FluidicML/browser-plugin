// This module mirrors the concept of locators as seen in playwright. The goal
// is to have a more semantically rich means of identifying elements on a page.
// As a fallback, we can defer to a more rigid CSS selector.

import { z } from "zod"

export const locatorSchema = z.object({
  role: z.string().optional(),
  title: z.string().optional(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  altText: z.string().optional(),
  testId: z.string().optional(),
  text: z.string().optional(),
  css: z.string(),
})

export type Locator = z.infer<typeof locatorSchema>

export const buildLocator = (el: HTMLElement): Locator => {
  return {
    role: undefined,
    title: el.getAttribute("title") ?? undefined,
    label:
      el.getAttribute("aria-label") ??
      el.getAttribute("aria-labelledby") ??
      undefined,
    placeholder: el.getAttribute("placeholder") ?? undefined,
    altText: el.getAttribute("alt") ?? undefined,
    testId: el.getAttribute("data-testid") ?? undefined,
    text: el.innerText || undefined,
    css: "",
  }
}

export const serializeLocator = (locator: Locator): string => {
  const output = []
  for (const [key, value] of Object.entries(locator) as [string, string][]) {
    output.push(`${key} > ${value}`)
  }
  return output.join(", ")
}
