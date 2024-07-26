export default defineBackground(() => {
  // https://github.com/wxt-dev/wxt/issues/570
  // @ts-ignore
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((e: any) => console.error("FLUIDIC", e))

  browser.runtime.onMessage.addListener(async (message) => {
    const allTabs = await browser.tabs.query({})
    const contentScriptMatches = new MatchPattern("*://*/*")
    const contentScriptTabs = allTabs.filter(
      (tab) =>
        tab.id != null &&
        tab.url != null &&
        contentScriptMatches.includes(tab.url)
    )

    const responses = await Promise.all(
      contentScriptTabs.map(async (tab) => {
        const response = await browser.tabs.sendMessage(tab.id!, message)
        return { tab: tab.id, response }
      })
    )

    return responses
  })
})
