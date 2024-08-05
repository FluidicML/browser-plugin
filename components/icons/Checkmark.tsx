import React from "react"

const SvgComponent = ({ ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fillRule="evenodd"
      d="M1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12Zm17.416-2.296a1 1 0 0 0-.003-1.414l-.709-.706a1 1 0 0 0-1.414.003l-5.772 5.797-3.32-3.275a1 1 0 0 0-1.415.01l-.702.712a1 1 0 0 0 .01 1.414l4.738 4.672a1 1 0 0 0 1.41-.006l7.177-7.207Z"
      clipRule="evenodd"
    />
  </svg>
)

export default SvgComponent
