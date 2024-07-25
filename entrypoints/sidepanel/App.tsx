import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function App() {
  return (
    <Tabs defaultValue="builder" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="builder">Builder</TabsTrigger>
        <TabsTrigger value="library">Library</TabsTrigger>
        <TabsTrigger value="runner">Runner</TabsTrigger>
      </TabsList>
      <TabsContent value="builder">
        <div />
      </TabsContent>
      <TabsContent value="library">
        <div />
      </TabsContent>
      <TabsContent value="runner">
        <div />
      </TabsContent>
    </Tabs>
  )
}

export default App
