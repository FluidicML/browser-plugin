import React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import BuilderTab from "./BuilderTab"
import LibraryTab from "./LibraryTab"
import RunnerTab from "./RunnerTab"

function App() {
  const [tabValue, setTabValue] = React.useState("builder")

  return (
    <Tabs value={tabValue} onValueChange={setTabValue}>
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="builder">Builder</TabsTrigger>
        <TabsTrigger value="library">Library</TabsTrigger>
        <TabsTrigger value="runner">Runner</TabsTrigger>
      </TabsList>
      <TabsContent value="builder" forceMount hidden={tabValue !== "builder"}>
        <BuilderTab />
      </TabsContent>
      <TabsContent value="library" forceMount hidden={tabValue !== "library"}>
        <LibraryTab />
      </TabsContent>
      <TabsContent value="runner" forceMount hidden={tabValue !== "runner"}>
        <RunnerTab />
      </TabsContent>
    </Tabs>
  )
}

export default App
