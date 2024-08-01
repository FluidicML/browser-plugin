const run = async (selector: Selector): Promise<StepResult> => {
  const matches = findSelector(selector)

  if (matches.length === 0) {
    return { success: false, messages: ["Could not find element."] }
  } else if (matches.length > 1) {
    return { success: false, messages: ["Too many matched elements."] }
  }

  const target = matches[0]

  target.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true })
  )
  target.click()

  return { success: true, messages: [] }
}

export default defineContentScript({
  matches: [],

  async main(): Promise<StepResult> {
    try {
      return await run(window.fluidic_args.selector)
    } catch (err) {
      console.error(err)
    } finally {
      window.fluidic_args = undefined
    }
    return { success: false, messages: ["Unknown error"] }
  },
})
