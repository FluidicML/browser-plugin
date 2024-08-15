import React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type TabValue, useSharedStore } from "./store"
import BuilderTab from "./BuilderTab"
import LibraryTab from "./LibraryTab"
import RunnerTab from "./RunnerTab"
import SettingsTab from "./SettingsTab"
import { Event } from "@/utils/event"

function App() {
  const store = useSharedStore()

  React.useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  // Listen to any workflow trigger events that preload and/or auto execute flows
  React.useEffect(() => {
    const listener = addMessageListener((message) => {
      switch (message.event) {
        case Event.TRIGGER_WORKFLOW_QUERY: {
          return Promise.resolve(true)
        }
        case Event.TRIGGER_WORKFLOW_START: {
          const { openAIKey, workflow } = message.payload
          openAIKey && store.settingsActions.setOpenAIKey(openAIKey)
          store.sharedActions.setActiveTab("runner")
          store.runnerActions.startWorkflow(workflow)
          return
        }
      }
    })
    // Set data attribute to allow content scripts to block until app listeners have been set
    document.body.setAttribute("fluidic-react-app-loaded", "true")
    return () => removeMessageListener(listener)
  }, [])

  return (
    <Tabs
      className="flex flex-col h-screen"
      value={store.sharedActiveTab}
      onValueChange={(value) =>
        store.sharedActions.setActiveTab(value as TabValue)
      }
    >
      <TabsList className="grid grid-cols-4">
        <TabsTrigger value="builder">Builder</TabsTrigger>
        <TabsTrigger value="library">Library</TabsTrigger>
        <TabsTrigger value="runner">Runner</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent
        className="overflow-y-auto scrollbar h-full"
        value="builder"
        forceMount
        hidden={store.sharedActiveTab !== "builder"}
      >
        <BuilderTab />
      </TabsContent>
      <TabsContent
        className="overflow-y-auto scrollbar"
        value="library"
        forceMount
        hidden={store.sharedActiveTab !== "library"}
      >
        <LibraryTab />
      </TabsContent>
      <TabsContent
        className="overflow-y-auto scrollbar"
        value="runner"
        forceMount
        hidden={store.sharedActiveTab !== "runner"}
      >
        <RunnerTab />
      </TabsContent>
      <TabsContent
        className="overflow-y-auto scrollbar"
        value="settings"
        forceMount
        hidden={store.sharedActiveTab !== "settings"}
      >
        <SettingsTab />
      </TabsContent>
    </Tabs>
  )
}

export default App
