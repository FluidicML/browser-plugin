import React from "react"

import FolderIcon from "@/components/icons/Folder"
import { useSharedStore } from "./store"

const RunnerTab = () => {
  const store = useSharedStore()

  if (store.running === null) {
    return (
      <div className="flex flex-col items-center gap-2 p-4">
        <FolderIcon className="w-12 h-12 fill-black dark:fill-white" />
        <p className="text-center text-base">No running workflow.</p>
      </div>
    )
  }

  return <div>Running...</div>
}

export default RunnerTab
