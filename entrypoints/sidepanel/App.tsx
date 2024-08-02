import React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { type TabValue, useSharedStore } from "./store"
import BuilderTab from "./BuilderTab"
import LibraryTab from "./LibraryTab"
import RunnerTab from "./RunnerTab"

function App() {
  const store = useSharedStore()

  React.useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

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
        className="overflow-y-auto scrollbar h-full"
        value="builder"
        forceMount
        hidden={store.activeTab !== "builder"}
      >
        <BuilderTab />
      </TabsContent>
      <TabsContent
        className="overflow-y-auto scrollbar"
        value="library"
        forceMount
        hidden={store.activeTab !== "library"}
      >
        <LibraryTab />
      </TabsContent>
      <TabsContent
        className="overflow-y-auto scrollbar"
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
