import React from "react"

const SvgComponent = ({ ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    strokeLinejoin="round"
    strokeMiterlimit="10"
    strokeLinecap="round"
    fill="none"
    {...props}
  >
    <path d="m4 11 11 7 13-9-11-7z" className="st0" />
    <path d="M4 11v6l11 7 13-9h0c-1.2-1.2-1.5-3-.7-4.5L28 9" className="st0" />
    <path d="M4 17v6l11 7 13-9h0c-1.2-1.2-1.5-3-.7-4.5L28 15" className="st0" />
  </svg>
)

export default SvgComponent
