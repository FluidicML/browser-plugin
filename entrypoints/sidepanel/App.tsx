import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function App() {
  return (
    <Tabs defaultValue="builder">
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="builder">Builder</TabsTrigger>
        <TabsTrigger value="library">Library</TabsTrigger>
        <TabsTrigger value="runner">Runner</TabsTrigger>
      </TabsList>
      <TabsContent value="builder">
        <div>Builder</div>
      </TabsContent>
      <TabsContent value="library">
        <div>Library</div>
      </TabsContent>
      <TabsContent value="runner">
        <div>Runner</div>
      </TabsContent>
    </Tabs>
  )
}

export default App
