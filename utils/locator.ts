// This module mirrors the concept of locators as seen in playwright. The goal
// is to have a more semantically rich means of identifying elements on a page.
// As a fallback, we can defer to a more rigid CSS selector.

export type Locator = {
  role?: string
  title?: string
  label?: string
  placeholder?: string
  altText?: string
  testId?: string
  text?: string
  css?: string
}

export const buildLocator = (el: HTMLElement): Locator => {
  const locator: Locator = {
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
  }

  if (Object.values(locator).filter(Boolean).length === 0) {
    return { css: "" }
  }

  return locator
}

export const serializeLocator = (locator: Locator): string => {
  const output = []
  for (const [key, value] of Object.entries(locator) as [string, string][]) {
    output.push(`${key} > ${value}`)
  }
  return output.join(", ")
}
