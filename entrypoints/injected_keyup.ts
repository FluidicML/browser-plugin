const run = async (selector: Selector, value: string): Promise<StepResult> => {
  const matches = findSelector(selector)

  if (matches.length === 0) {
    return { success: false, messages: ["Could not find element."] }
  } else if (matches.length > 1) {
    return { success: false, messages: ["Too many matched elements."] }
  }

  const target = matches[0]

  for (const key of value) {
    target.dispatchEvent(
      new KeyboardEvent("keyup", {
        bubbles: true,
        cancelable: true,
        key,
      })
    )
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      target.value += key
    }
  }

  return { success: true, messages: [] }
}

export default defineContentScript({
  matches: [],

  async main(): Promise<StepResult> {
    try {
      return await run(window.fluidic_args.selector, window.fluidic_args.value)
    } catch (err) {
      console.error(err)
    } finally {
      window.fluidic_args = undefined
    }
    return { success: false, messages: ["Unknown error"] }
  },
})
