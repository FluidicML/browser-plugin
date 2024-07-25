import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import BuilderTab from "./BuilderTab"
import LibraryTab from "./LibraryTab"
import RunnerTab from "./RunnerTab"

function App() {
  return (
    <Tabs defaultValue="builder">
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="builder">Builder</TabsTrigger>
        <TabsTrigger value="library">Library</TabsTrigger>
        <TabsTrigger value="runner">Runner</TabsTrigger>
      </TabsList>
      <TabsContent value="builder">
        <BuilderTab />
      </TabsContent>
      <TabsContent value="library">
        <LibraryTab />
      </TabsContent>
      <TabsContent value="runner">
        <RunnerTab />
      </TabsContent>
    </Tabs>
  )
}

export default App
