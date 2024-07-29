import React from "react"

const SvgComponent = ({ ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" {...props}>
    <path
      fillRule="evenodd"
      d="M22.393 10.43s-7.058 12.3-7.18 12.41a1 1 0 0 1-1.413-.04l-4.572-4.22a.995.995 0 0 1 .046-1.41 1.001 1.001 0 0 1 1.414.04l3.578 3.3 6.395-11.08c.276-.47.887-.64 1.366-.36.478.27.642.89.366 1.36ZM16 0C7.164 0 0 7.16 0 16s7.164 16 16 16 16-7.16 16-16S24.836 0 16 0Z"
    />
  </svg>
)

export default SvgComponent
