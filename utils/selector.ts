// This module mirrors the concept of locators as seen in playwright. The goal
// is to have a more semantically rich means of identifying elements on a page.
// As a fallback, we can defer to a more rigid CSS selector.

import { z } from "zod"

export const locatorSchema = z.object({
  tag: z.string(),
  role: z.string().optional(),
  title: z.string().optional(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  altText: z.string().optional(),
  testId: z.string().optional(),
  text: z.string().optional(),
})

export type Locator = z.infer<typeof locatorSchema>

export const locatorToMap = (locator: Locator): Map<string, string> => {
  return new Map(Object.entries(locator))
}

// Representation of either a locator or CSS selector string.
export const selectorSchema = locatorSchema.or(z.string())

export type Selector = z.infer<typeof selectorSchema>

const TEXTBOX_INPUT_TYPES = [
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
]

// Build up a query from a locator. There is a bit of a balancing act being
// performed at the moment. If we attempt to only return elements that match
// all of our fields exactly, any minor change to the DOM could result in a
// failed match that the user would expect to continue succeeding. If on the
// other hand we are too loose, we may end up matching too many elements and
// not being able to decide how to proceed (on e.g. replay).
//
// As a compromise, allow the caller to specify a prioritized list of all
// locator fields. As soon as we are able to filter down the number of matched
// elements to one (or, in failed cases, zero), stop processing any further.
//
// TODO: In practice, we probably need to make this much stricter. This fuzzy
// approach could lead to potentially harmful edge cases on replay if we aren't
// careful. For now, ignoring this issue.
class QueryBuilder {
  private matches: HTMLElement[]

  constructor(tag: string) {
    this.matches = Array.from(document.querySelectorAll(tag))
  }

  withRole(role?: string): QueryBuilder {
    if (role === undefined || this.matches.length <= 1) {
      return this
    }

    this.matches = this.matches.filter((m) => {
      if (m.getAttribute("role") === role) {
        return true
      }

      if (role === "button") {
        return m.tagName.toLowerCase() === "button"
      }

      if (role === "textbox" && m instanceof HTMLTextAreaElement) {
        return true
      }

      if (role === "textbox" && m instanceof HTMLInputElement) {
        return TEXTBOX_INPUT_TYPES.includes(m.getAttribute("type"))
      }

      // Encountered either an invalid or unsupported role.
      return false
    })

    return this
  }

  withTitle(title?: string): QueryBuilder {
    if (title === undefined || this.matches.length <= 1) {
      return this
    }

    this.matches = this.matches.filter((m) => m.getAttribute("title") === title)

    return this
  }

  withLabel(label?: string): QueryBuilder {
    if (label === undefined || this.matches.length <= 1) {
      return this
    }

    this.matches = this.matches.filter((m) => {
      for (const attr of ["aria-label", "aria-labelledby"]) {
        if (m.getAttribute(attr) === label) {
          return true
        }
      }
      return false
    })

    return this
  }

  withPlaceholder(placeholder?: string): QueryBuilder {
    if (placeholder === undefined || this.matches.length <= 1) {
      return this
    }

    this.matches = this.matches.filter(
      (m) => m.getAttribute("placeholder") === placeholder
    )

    return this
  }

  withAltText(altText?: string): QueryBuilder {
    if (altText === undefined || this.matches.length <= 1) {
      return this
    }

    this.matches = this.matches.filter((m) => m.getAttribute("alt") === altText)

    return this
  }

  withTestId(testId?: string): QueryBuilder {
    if (testId === undefined || this.matches.length <= 1) {
      return this
    }

    this.matches = this.matches.filter(
      (m) => m.getAttribute("data-testid") === testId
    )

    return this
  }

  withText(text?: string): QueryBuilder {
    if (text === undefined || this.matches.length <= 1) {
      return this
    }

    this.matches = this.matches.filter((m) => m.innerText === text)

    return this
  }

  query(): HTMLElement[] {
    return this.matches
  }
}

export const findSelector = (selector: Selector): HTMLElement[] => {
  // It's assumed the CSS selector is unique.
  if (typeof selector === "string") {
    const found = document.querySelector(selector)
    return found instanceof HTMLElement ? [found] : []
  }

  return new QueryBuilder(selector.tag)
    .withRole(selector.role)
    .withTitle(selector.title)
    .withLabel(selector.label)
    .withPlaceholder(selector.placeholder)
    .withAltText(selector.altText)
    .withTestId(selector.testId)
    .withText(selector.text)
    .query()
}

const getTag = (el: HTMLElement) => {
  return el.tagName
}

const getRole = (el: HTMLElement) => {
  const roleAttr = el.getAttribute("role")
  if (roleAttr) {
    return roleAttr
  }

  if (el instanceof HTMLButtonElement) {
    return "button"
  }

  if (el instanceof HTMLTextAreaElement) {
    return "textbox"
  }

  if (
    el instanceof HTMLInputElement &&
    TEXTBOX_INPUT_TYPES.includes(el.getAttribute("type"))
  ) {
    return "textbox"
  }

  return undefined
}

const getTitle = (el: HTMLElement) => {
  return el.getAttribute("title") ?? undefined
}

const getLabel = (el: HTMLElement) => {
  return (
    el.getAttribute("aria-label") ??
    el.getAttribute("aria-labelledby") ??
    undefined
  )
}

const getPlaceholder = (el: HTMLElement) => {
  return el.getAttribute("placeholder") ?? undefined
}

const getAltText = (el: HTMLElement) => {
  return el.getAttribute("alt") ?? undefined
}

const getTestId = (el: HTMLElement) => {
  return el.getAttribute("data-testid") ?? undefined
}

const getText = (el: HTMLElement) => {
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
    return el.tagName.toLowerCase()
  }

  // With the advent of utility and generated classes, the class list isn't a
  // particularly useful means of distinguishing elements. Still, it's
  // something. Try to match on the smallest subset of classes we can,
  // starting with no class.
  let suffix = ""
  for (const cls of el.classList) {
    suffix += `.${cls}`
    const selector = `${el.tagName.toLowerCase()}${suffix}`
    if (el.parentElement.querySelectorAll(selector).length === 1) {
      return selector
    }
  }

  // As a fallback, just find the child's position in its parent.
  let index = 0
  for (const child of el.parentElement.children) {
    if (child.tagName === el.tagName) {
      index += 1
    }
    if (child === el) {
      break
    }
  }

  return `${el.tagName.toLowerCase()}:nth-of-type(${index})`
}

// Build a series of selectors, starting from our specified element and working
// our way up to each subsequent parent node. Stop as soon as we finished
// building a nonambiguous selector.
const getCSS = (el: HTMLElement) => {
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

export const getSelector = (el: HTMLElement): Selector => {
  const locator: Locator = {
    tag: getTag(el),
    role: getRole(el),
    title: getTitle(el),
    label: getLabel(el),
    placeholder: getPlaceholder(el),
    altText: getAltText(el),
    testId: getTestId(el),
    text: getText(el),
  }

  if (
    Object.values(locator).filter(Boolean).length === 0 ||
    findSelector(locator).length !== 1
  ) {
    return getCSS(el)
  }

  return locator
}
