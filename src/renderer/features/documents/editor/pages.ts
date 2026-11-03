import { Extension, Node } from '@tiptap/core'
import type { Node as ProseNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'
import { A4, layoutStyle, pageLayout, type DocumentNode } from '@shared/document'

/** CSS pixels per point, and the height of an A4 sheet and of the gap shown between sheets. */
const PX = 96 / 72
const SHEET = Math.round(A4.height * PX)
const GAP = 24

/** The document root, carrying the page layout an import measured (see `pageLayout`). */
export const PagedDocument = Node.create({
  name: 'doc',
  topNode: true,
  content: '(block | pageBreak)+',
  addAttributes() {
    return {
      margins: { default: null },
      lineHeight: { default: null },
      blockSpacing: { default: null },
      listIndent: { default: null },
      fontSize: { default: null },
    }
  },
})

/** Starts a new page, as where an imported PDF's page ended. */
export const PageBreak = Node.create({
  name: 'pageBreak',
  atom: true,
  selectable: true,
  parseHTML: () => [{ tag: 'div.page-break' }],
  renderHTML: () => ['div', { class: 'page-break' }],
})

type Gap = { pos: number; height: number; band: number }
type PageState = { decorations: DecorationSet; gaps: Gap[]; pages: number }
const key = new PluginKey<PageState>('pages')
const layoutOf = (doc: ProseNode) => pageLayout({ type: 'doc', attrs: doc.attrs } as DocumentNode)

/** The grey space between two sheets, drawn across the full width of the paper. */
function gapWidget(gap: Gap) {
  const spacer = document.createElement('div')
  spacer.className = 'page-gap'
  spacer.contentEditable = 'false'
  spacer.style.height = `${gap.height}px`
  const band = document.createElement('div')
  band.className = 'page-gap-band'
  // left in place, it starts where the spacer does; the margin moves it down to the sheet's end
  band.style.marginTop = `${gap.band}px`
  band.style.height = `${GAP}px`
  spacer.append(band)
  return spacer
}

/** Positions where content may move to a new page: each top-level block, or each list item. */
function breakpoints(doc: ProseNode): { pos: number; forced: boolean }[] {
  const points: { pos: number; forced: boolean }[] = []
  let forced = false
  doc.forEach((node, offset) => {
    if (node.type.name === 'pageBreak') {
      forced = true
      return
    }
    if (['bulletList', 'orderedList'].includes(node.type.name))
      node.forEach((_item, itemOffset, index) => {
        points.push({ pos: offset + 1 + itemOffset, forced: forced && index === 0 })
      })
    else points.push({ pos: offset, forced })
    forced = false
  })
  return points
}

/**
 * Where the gaps between pages go: each block keeps the position it would have with no gaps,
 * and the first block that would cross a page's bottom margin, or follows a page break, is
 * pushed to the top of the next sheet.
 */
function measure(view: EditorView, previous: Gap[]): { gaps: Gap[]; pages: number } {
  const { margins } = layoutOf(view.state.doc)
  const top = margins[0] * PX,
    bottom = margins[2] * PX
  const room = SHEET - top - bottom
  const before = new Map(previous.map((gap) => [gap.pos, gap.height]))
  const gaps: Gap[] = []
  let oldShift = 0,
    shift = 0,
    page = 0,
    pageStart = top
  for (const point of breakpoints(view.state.doc)) {
    const dom = view.nodeDOM(point.pos)
    if (!(dom instanceof HTMLElement)) continue
    oldShift += before.get(point.pos) ?? 0
    const natural = dom.offsetTop - oldShift,
      end = natural + dom.offsetHeight
    const overflows = end > pageStart + room && natural > pageStart + 1
    if (point.forced || overflows) {
      const target = (page + 1) * (SHEET + GAP) + top
      const height = Math.max(0, target - (natural + shift))
      gaps.push({ pos: point.pos, height, band: height - top - GAP })
      shift += height
      page += 1
      pageStart = natural
    }
  }
  return { gaps, pages: page + 1 }
}

const sameGaps = (a: Gap[], b: Gap[]) =>
  a.length === b.length &&
  a.every((gap, i) => gap.pos === b[i].pos && Math.abs(gap.height - b[i].height) < 1)

/**
 * Shows the document on A4 sheets: the page layout as CSS variables on the paper, and gaps
 * between sheets wherever a page fills up. The gaps are decorations only; the document itself
 * holds nothing but its explicit page breaks.
 */
export const Pages = Extension.create({
  name: 'pages',
  addProseMirrorPlugins() {
    return [
      new Plugin<PageState>({
        key,
        state: {
          init: () => ({ decorations: DecorationSet.empty, gaps: [], pages: 1 }),
          apply(tr, value) {
            const next = tr.getMeta(key) as { gaps: Gap[]; pages: number } | undefined
            if (next)
              return {
                ...next,
                decorations: DecorationSet.create(
                  tr.doc,
                  next.gaps.map((gap) =>
                    Decoration.widget(gap.pos, () => gapWidget(gap), {
                      side: -1,
                      key: `gap-${gap.pos}-${Math.round(gap.height)}`,
                      ignoreSelection: true,
                    }),
                  ),
                ),
              }
            if (!tr.docChanged) return value
            // until the next measurement, the gaps move with the text they sit before
            const gaps = value.gaps.map((gap) => ({ ...gap, pos: tr.mapping.map(gap.pos) }))
            return { ...value, gaps, decorations: value.decorations.map(tr.mapping, tr.doc) }
          },
        },
        props: {
          decorations: (state) => key.getState(state)?.decorations,
          attributes: (state) => {
            const layout = layoutOf(state.doc)
            const pages = key.getState(state)?.pages ?? 1
            return {
              style: `${layoutStyle(layout)};min-height:${pages * SHEET + (pages - 1) * GAP}px`,
              ...(layout.blockSpacing !== null && { 'data-layout': 'exact' }),
            }
          },
        },
        view: (view) => {
          let frame = 0,
            passes = 0
          const run = () => {
            frame = 0
            if (!view.dom.isConnected) return
            const current = key.getState(view.state)!
            const next = measure(view, current.gaps)
            if (sameGaps(next.gaps, current.gaps) && next.pages === current.pages) return
            view.dispatch(view.state.tr.setMeta(key, next).setMeta('addToHistory', false))
            // gaps change how margins collapse; one more pass settles them, a third is not taken
            if (++passes < 2) schedule()
          }
          const schedule = () => {
            if (!frame) frame = requestAnimationFrame(run)
          }
          schedule()
          // late fonts and a new width move the text; the gaps' own height changes do not count
          let width = view.dom.offsetWidth
          const observer = new ResizeObserver(() => {
            if (view.dom.offsetWidth === width) return
            width = view.dom.offsetWidth
            passes = 0
            schedule()
          })
          observer.observe(view.dom)
          void document.fonts.ready.then(() => {
            passes = 0
            schedule()
          })
          return {
            update: (_view, previous) => {
              if (!view.state.doc.eq(previous.doc)) {
                passes = 0
                schedule()
              }
            },
            destroy: () => {
              cancelAnimationFrame(frame)
              observer.disconnect()
            },
          }
        },
      }),
    ]
  },
})
