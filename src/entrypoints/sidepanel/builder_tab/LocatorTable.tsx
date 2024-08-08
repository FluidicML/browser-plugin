import React from "react"

import type { Locator } from "$/utils/selector"

const locatorToMap = (locator: Locator): Map<string, string> => {
  return new Map(Object.entries(locator))
}

type LocatorTableProps = {
  locator: Locator
}

const LocatorTable = ({ locator }: LocatorTableProps) => {
  return (
    <table className="table-auto muted min-w-full">
      <tbody>
        {[...locatorToMap(locator).entries()].map(([key, val]) => (
          <tr key={key} className="[&:not(:last-child)]:border-b muted">
            <td className="align-top">
              <pre className="font-bold py-1 pr-1">{key}:</pre>
            </td>
            <td className="align-top">
              <pre className="py-1">{val}</pre>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
LocatorTable.displayName = "LocatorTable"

export default LocatorTable
