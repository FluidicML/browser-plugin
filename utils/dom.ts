export type FluidicElement = HTMLElement | SVGElement

export const isFluidicElement = (
  el?: EventTarget | Element | null
): el is FluidicElement => {
  return el instanceof HTMLElement || el instanceof SVGElement
}
