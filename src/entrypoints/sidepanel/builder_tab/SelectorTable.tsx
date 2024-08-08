import React from "react"

import type { Selector } from "$/utils/selector"
import LocatorTable from "./LocatorTable"

type SelectorTableProps = {
  selector: Selector
}

const SelectorTable = ({ selector }: SelectorTableProps) => {
  return (
    <div className="overflow-x-auto scrollbar-hidden">
      {typeof selector === "string" ? (
        <pre>{selector}</pre>
      ) : (
        <LocatorTable locator={selector} />
      )}
    </div>
  )
}
SelectorTable.displayName = "SelectorTable"

export default SelectorTable
