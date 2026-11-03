export type HairlineFigure = {
  name: string
  means: string
  rules: number[]
  range: [number, number, number]
  tour: ([number, number] | null)[] | null
  mount(
    host: { stage: HTMLElement; svg: SVGSVGElement; read: { textContent: string | null } },
    value: number,
  ): { set(value: number): void; destroy(): void }
}
