import React from "react"

const SvgComponent = ({ ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m9 20 7 7 7-7m0-8-7-7-7 7"
    />
  </svg>
)

export default SvgComponent
