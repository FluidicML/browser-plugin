import * as React from "react"

const SvgComponent = ({ ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m23 26-7-7-7 7M9 6l7 7 7-7"
    />
  </svg>
)

export default SvgComponent
