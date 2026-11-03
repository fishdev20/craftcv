/** The part of the hairline engine the renderer calls; figures use the rest. */
declare const HL: {
  inject(root: Document): void
  mk(tag: string, attrs: Record<string, string>, parent: Element): SVGSVGElement
}
export default HL
