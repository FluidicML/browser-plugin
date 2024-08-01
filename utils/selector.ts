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
})

export type Locator = z.infer<typeof locatorSchema>

// Representation of either a locator or CSS selector string.
export const selectorSchema = locatorSchema.or(z.string())

export type Selector = z.infer<typeof selectorSchema>

const buildRole = (el: HTMLElement) => {
  const roleAttr = el.getAttribute("role")
  if (roleAttr) {
    return roleAttr
  }

  if (el instanceof HTMLButtonElement) {
    return "button"
  }

  if (el instanceof HTMLInputElement) {
    const inputType = el.getAttribute("type")
    if (
      [
        null,
        "date",
        "datetime-local",
        "email",
        "month",
        "number",
        "password",
        "tel",
        "text",
        "time",
      ].includes(inputType)
    ) {
      return "textbox"
    }
  }
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

const relativeSelectorOf = (el: HTMLElement) => {
  const idAttr = el.getAttribute("id")
  if (idAttr) {
    // Avoid using `#` to identify an id. Though typically not the case, it is
    // possible an id specifies whitespace.
    return `[id="${idAttr}"]`
  }

  if (!el.parentElement) {
    return el.nodeName
  }

  // With the advent of utility and generated classes, the class list isn't a
  // particularly useful means of distinguishing elements. Still, it's
  // something. Try to match on the smallest subset of classes we can,
  // starting with no class.
  let suffix = ""
  for (const cls of el.classList) {
    suffix += `.${cls}`
    const selector = `${el.nodeName}${suffix}`
    if (el.parentElement.querySelectorAll(selector).length === 1) {
      return selector
    }
  }

  // As a fallback, just find the child's position in its parent.
  let index = 0
  for (const child of el.parentElement.children) {
    if (child.nodeName === el.nodeName) {
      index += 1
    }
    if (child === el) {
      break
    }
  }
  return `${el.nodeName}:nth-of-type(${index})`
}

// Build a series of selectors, starting from our specified element and working
// our way up to each subsequent parent node. Stop as soon as we finished
// building a nonambiguous selector.
const buildCSS = (el: HTMLElement) => {
  const selectors = []

  while (el) {
    selectors.unshift(relativeSelectorOf(el))
    if (document.querySelectorAll(selectors.join(" ")).length === 1) {
      return selectors.join(" ")
    }
    if (!el.parentElement) {
      break
    }
    el = el.parentElement
  }

  return ""
}

export const buildSelector = (el: HTMLElement): Selector => {
  const locator: Locator = {
    role: buildRole(el),
    title: buildTitle(el),
    label: buildLabel(el),
    placeholder: buildPlaceholder(el),
    altText: buildAltText(el),
    testId: buildTestId(el),
    text: buildText(el),
  }

  if (Object.values(locator).filter(Boolean).length === 0) {
    return buildCSS(el)
  }

  return locator
}
