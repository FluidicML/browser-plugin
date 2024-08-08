import { type Tabs, browser } from "wxt/browser"

const waitUntilComplete = (tab: Tabs.Tab): Promise<Tabs.Tab> => {
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

// Wait until the tab with the specified id is in a completed state.
export const waitForTab = (tabId: number): Promise<void> => {
  return new Promise((resolve) => {
    browser.tabs.get(tabId).then((tab) => {
      waitUntilComplete(tab).then(() => resolve())
    })
  })
}

// Thin wrapper around tab creation. Waits until the tab has completely loaded.
export const createTab = (
  createProperties: Tabs.CreateCreatePropertiesType
): Promise<Tabs.Tab> => {
  return new Promise((resolve) => {
    browser.tabs.create(createProperties).then((tab) => {
      waitUntilComplete(tab).then(resolve)
    })
  })
}

// Thin wrapper around tab updates. Waits until the tab has completely loaded.
export const updateTab = (
  tabId: number,
  updateProperties: Tabs.UpdateUpdatePropertiesType
): Promise<Tabs.Tab> => {
  return new Promise((resolve) => {
    browser.tabs.update(tabId, updateProperties).then((tab) => {
      waitUntilComplete(tab).then(resolve)
    })
  })
}

// Thin wrapper around tab queries. Waits until each tab has completely loaded.
export const queryTabs = (
  queryInfo: Tabs.QueryQueryInfoType
): Promise<Tabs.Tab[]> => {
  return new Promise((resolve) => {
    browser.tabs.query(queryInfo).then((tabs) => {
      Promise.all(tabs.map((tab) => waitUntilComplete(tab))).then(resolve)
    })
  })
}
