import React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageEvent,
  addMessageListener,
  removeMessageListener,
} from "@/utils/messages"

import { type TabValue, useHydration, useSharedStore } from "./store"
import BuilderTab from "./BuilderTab"
import LibraryTab from "./LibraryTab"
import RunnerTab from "./RunnerTab"

function App() {
  const hydrated = useHydration()
  const store = useSharedStore()

  React.useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  React.useEffect(() => {
    if (!hydrated) {
      return
    }

    const listener = addMessageListener((message) => {
      switch (message.event) {
        case MessageEvent.CAPTURE_QUERY: {
          return Promise.resolve(store.isCapturing)
        }
      }
    })

    return () => removeMessageListener(listener)
  }, [hydrated, store.isCapturing])

  return (
    <Tabs
      className="flex flex-col h-screen"
      value={store.activeTab}
      onValueChange={(value) => store.actions.setActiveTab(value as TabValue)}
    >
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="builder">Builder</TabsTrigger>
        <TabsTrigger value="library">Library</TabsTrigger>
        <TabsTrigger value="runner">Runner</TabsTrigger>
      </TabsList>
      <TabsContent
        className="overflow-y-auto h-full"
        value="builder"
        forceMount
        hidden={store.activeTab !== "builder"}
      >
        <BuilderTab />
      </TabsContent>
      <TabsContent
        className="overflow-y-auto"
        value="library"
        forceMount
        hidden={store.activeTab !== "library"}
      >
        <LibraryTab />
      </TabsContent>
      <TabsContent
        className="overflow-y-auto"
        value="runner"
        forceMount
        hidden={store.activeTab !== "runner"}
      >
        <RunnerTab />
      </TabsContent>
    </Tabs>
  )
}

export default App
