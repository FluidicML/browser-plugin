import React from "react"

const SvgComponent = ({ ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M12.261 1.035A1 1 0 0 1 13 2v7h6a1 1 0 0 1 .864 1.504l-7 12A1 1 0 0 1 11 22v-7H5a1 1 0 0 1-.864-1.504l7-12a1 1 0 0 1 1.125-.461ZM6.741 13H12a1 1 0 0 1 1 1v4.301L17.259 11H12a1 1 0 0 1-1-1V5.699L6.741 13Z"
      clipRule="evenodd"
    />
  </svg>
)

export default SvgComponent
