// This module mirrors the concept of locators as seen in playwright. The goal
// is to have a more semantically rich means of identifying elements on a page.
// As a fallback, we can defer to a more rigid CSS selector.

import { z } from "zod"

import { subrolesOf, getRole } from "./roles"

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

// Representation of either a locator or CSS selector string.
export const selectorSchema = locatorSchema.or(z.string())

export type Selector = z.infer<typeof selectorSchema>

class QueryBuilder {
  private matches: HTMLElement[]

  constructor(tag: string) {
    this.matches = Array.from(document.querySelectorAll(tag))
  }

  withRole(role?: string): QueryBuilder {
    if (role === undefined) {
      return this
    }

    const subroles = subrolesOf(role)
    this.matches = this.matches.filter((m) => {
      const roleAttr = m.getAttribute("role") ?? getRole(m)
      return roleAttr && subroles.includes(roleAttr)
    })

    return this
  }

  withTitle(title?: string): QueryBuilder {
    if (title === undefined) {
      return this
    }

    this.matches = this.matches.filter((m) => m.getAttribute("title") === title)

    return this
  }

  withLabel(label?: string): QueryBuilder {
    if (label === undefined) {
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
    if (placeholder === undefined) {
      return this
    }

    this.matches = this.matches.filter(
      (m) => m.getAttribute("placeholder") === placeholder
    )

    return this
  }

  withAltText(altText?: string): QueryBuilder {
    if (altText === undefined) {
      return this
    }

    this.matches = this.matches.filter((m) => m.getAttribute("alt") === altText)

    return this
  }

  withTestId(testId?: string): QueryBuilder {
    if (testId === undefined) {
      return this
    }

    this.matches = this.matches.filter(
      (m) => m.getAttribute("data-testid") === testId
    )

    return this
  }

  withText(text?: string): QueryBuilder {
    if (text === undefined) {
      return this
    }

    this.matches = this.matches.filter((m) => m.innerText === text)

    return this
  }

  query(): HTMLElement[] {
    return this.matches
  }
}

const findSelector = (selector: Selector): HTMLElement[] => {
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

export const waitForSelector = async (
  selector: Selector,
  timeoutMillis: number
): Promise<HTMLElement[]> => {
  return new Promise((resolve) => {
    const matches = findSelector(selector)
    if (matches.length > 0) {
      return resolve(matches)
    }

    let timeoutId: number | null = null

    const observer = new MutationObserver(() => {
      const matches = findSelector(selector)
      if (matches.length > 0) {
        if (timeoutId !== null) {
          clearTimeout(timeoutId)
        }
        observer.disconnect()
        resolve(matches)
      }
    })

    timeoutId = window.setTimeout(() => {
      observer.disconnect()
      resolve([])
    }, timeoutMillis)

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    })
  })
}

const getTag = (el: HTMLElement) => {
  return el.tagName.toLowerCase()
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
  const locator: Locator = { tag: getTag(el) }

  if (findSelector(locator).length === 1) {
    return locator
  }

  const fields: [keyof Locator, (el: HTMLElement) => string | undefined][] = [
    ["role", getRole],
    ["title", getTitle],
    ["label", getLabel],
    ["altText", getAltText],
    ["placeholder", getPlaceholder],
    ["testId", getTestId],
    ["text", getText],
  ]

  for (const [key, func] of fields) {
    const result = func(el)
    if (result) {
      locator[key] = result
      const found = findSelector(locator)
      if (found.length === 0) {
        return getCSS(el)
      } else if (found.length === 1) {
        return locator
      }
    }
  }

  return getCSS(el)
}
