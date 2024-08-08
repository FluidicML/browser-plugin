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
      d="M3.464 3.464C2 4.93 2 7.286 2 12c0 4.714 0 7.071 1.464 8.535l17.072-17.07C19.07 2 16.713 2 12 2 7.286 2 4.929 2 3.464 3.464Z"
      clipRule="evenodd"
    />
    <path
      fill="#1C274C"
      d="M3.465 20.536C4.929 22 7.286 22 12 22s7.071 0 8.536-1.464C22 19.07 22 16.714 22 12c0-4.714 0-7.07-1.464-8.535L3.465 20.535Z"
      opacity={0.5}
    />
  </svg>
)

export default SvgComponent
