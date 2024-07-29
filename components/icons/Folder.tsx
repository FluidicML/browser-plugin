import React from "react"

const SvgComponent = ({ ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" {...props}>
    <path
      fillRule="evenodd"
      d="M18 6H9.374L7.416 2H2v16h16V6Zm2-2v16H0V0h8.437l2 4H20ZM9.022 16h2v-2h-2v2ZM9 12h2V8H9v4Z"
    />
  </svg>
)

export default SvgComponent
