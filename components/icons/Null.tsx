import React from "react"

const SvgComponent = ({ ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17" {...props}>
    <path
      fillRule="evenodd"
      d="M8.021 1.097C3.625 1.097.063 4.655.063 9.04c0 4.388 3.562 7.945 7.958 7.945 4.395 0 7.958-3.558 7.958-7.945 0-4.386-3.564-7.943-7.958-7.943ZM10.271 10H5.729C4.772 10 4 10.05 4 9c0-1.053.772-1 1.728-1h4.544C11.228 8 12 7.946 12 9c0 1.051-.772 1-1.728 1Z"
    />
  </svg>
)

export default SvgComponent
