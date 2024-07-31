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

const buildRole = (el: HTMLElement) => {
  return undefined
}

const buildTitle = (el: HTMLElement) => {
  return el.getAttribute("title") ?? undefined
}

const buildLabel = (el: HTMLElement) => {
  return (
    el.getAttribute("aria-label") ??
    el.getAttribute("aria-labelledby") ??
    undefined
  )
}

const buildPlaceholder = (el: HTMLElement) => {
  return el.getAttribute("placeholder") ?? undefined
}

const buildAltText = (el: HTMLElement) => {
  return el.getAttribute("alt") ?? undefined
}

const buildTestId = (el: HTMLElement) => {
  return el.getAttribute("data-testid") ?? undefined
}

const buildText = (el: HTMLElement) => {
  return el.innerText || undefined
}

const buildCSS = (el: HTMLElement) => {
  return ""
}

export const buildLocator = (el: HTMLElement): Locator => {
  return {
    role: buildRole(el),
    title: buildTitle(el),
    label: buildLabel(el),
    placeholder: buildPlaceholder(el),
    altText: buildAltText(el),
    testId: buildTestId(el),
    text: buildText(el),
    css: buildCSS(el),
  }
}
