import React from "react"

import BooksIcon from "@/components/icons/Books"
import LightningIcon from "@/components/icons/Lightning"
import PlayCircleIcon from "@/components/icons/PlayCircle"
import TrashIcon from "@/components/icons/Trash"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { useSharedStore } from "./store"
import type { Workflow } from "@/utils/workflow"

type WorkflowCardProps = {
  workflow: Workflow
  index: number
}

const WorkflowCard = ({ workflow, index }: WorkflowCardProps) => {
  const store = useSharedStore()

  return (
    <Card className="p-4">
      <CardTitle className="pb-2">{workflow.init.workflowName}</CardTitle>
      <CardDescription>
        Launches{" "}
        <a target="_blank" href={workflow.init.launchUrl} className="underline">
          {workflow.init.launchUrl}
        </a>
        .
      </CardDescription>
      <CardContent className="min-h-16 flex flex-col justify-end pt-4 relative">
        <div className="flex items-center gap-1">
          <LightningIcon className="w-4 h-4 fill-black dark:fill-white" />
          {workflow.actions.length} Actions
        </div>
        <div className="flex gap-2 absolute right-0 bottom-0">
          <Button
            size="xs"
            className="group hover:bg-destructive/90"
            onClick={() => {
              store.actions.removeWorkflow(index)
            }}
          >
            <TrashIcon className="w-5 h-5 stroke-white dark:stroke-black group-hover:stroke-white" />
          </Button>
          <Button size="xs" className="group hover:bg-emerald-600/90">
            <PlayCircleIcon className="w-5 h-5 fill-white dark:fill-black group-hover:fill-white" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const LibraryTab = () => {
  const store = useSharedStore()

  if (store.library.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-4">
        <BooksIcon className="w-12 h-12 stroke-black dark:stroke-white" />
        <p className="text-center text-base">No saved workflows.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col p-4 gap-4">
      {store.library.map((w, i) => (
        // TODO: Not a great key. Make more unique.
        <WorkflowCard
          key={`${w.init.workflowName}-${i}`}
          workflow={w}
          index={i}
        />
      ))}
    </div>
  )
}

export default LibraryTab
