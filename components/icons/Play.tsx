import * as React from "react"

const SvgComponent = ({ ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      fill="#1C274C"
      fillRule="evenodd"
      d="M23 12c0-1.035-.53-2.07-1.591-2.647L8.597 2.385C6.534 1.264 4 2.724 4 5.033V12h19Z"
      clipRule="evenodd"
    />
    <path
      fill="#1C274C"
      d="m8.597 21.614 12.812-6.967A2.988 2.988 0 0 0 23 12H4v6.967c0 2.31 2.534 3.769 4.597 2.648Z"
      opacity={0.5}
    />
  </svg>
)

export default SvgComponent
