import type { Tabs } from "wxt/browser"

const waitTabCompleted = (tab: Tabs.Tab): Promise<Tabs.Tab> => {
  return new Promise((resolve) => {
    if (tab.status === "complete") {
      return resolve(tab)
    }
    const listener = (
      tabId: number,
      changeInfo: Tabs.OnUpdatedChangeInfoType
    ) => {
      if (tab.id === tabId && changeInfo.status === "complete") {
        browser.tabs.onUpdated.removeListener(listener)
        resolve(tab)
      }
    }
    browser.tabs.onUpdated.addListener(listener)
  })
}

export const createTabUntilComplete = (
  createProperties: Tabs.CreateCreatePropertiesType
): Promise<Tabs.Tab> => {
  return new Promise((resolve) => {
    browser.tabs.create(createProperties).then((tab) => {
      waitTabCompleted(tab).then(resolve)
    })
  })
}

export const updateTabUntilComplete = (
  tabId: number,
  updateProperties: Tabs.UpdateUpdatePropertiesType
): Promise<Tabs.Tab> => {
  return new Promise((resolve) => {
    browser.tabs.update(tabId, updateProperties).then((tab) => {
      waitTabCompleted(tab).then(resolve)
    })
  })
}
