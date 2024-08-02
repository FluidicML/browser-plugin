import React from "react"

import type { Locator } from "@/utils/selector"

const locatorToMap = (locator: Locator): Map<string, string> => {
  return new Map(Object.entries(locator))
}

type LocatorTableProps = {
  locator: Locator
}

const LocatorTable = ({ locator }: LocatorTableProps) => {
  return (
    <table className="table-auto">
      <tbody>
        {[...locatorToMap(locator).entries()].map(([key, val]) => (
          <tr key={key}>
            <td className="text-right">
              <pre className="font-bold pr-1">{key}:</pre>
            </td>
            <td>
              <pre>{val}</pre>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
LocatorTable.displayName = "LocatorTable"

export default LocatorTable
