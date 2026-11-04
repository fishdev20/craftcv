import { Extension, Mark, Node, type Editor } from '@tiptap/core'
import type { Node as ProseNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

/** Superscript and subscript; each replaces the other, as in a word processor. */
export const Superscript = Mark.create({
  name: 'superscript',
  excludes: 'subscript',
  parseHTML: () => [{ tag: 'sup' }],
  renderHTML: () => ['sup', 0],
  addKeyboardShortcuts() {
    return { 'Mod-.': () => this.editor.commands.toggleMark(this.name) }
  },
})

export const Subscript = Mark.create({
  name: 'subscript',
  excludes: 'superscript',
  parseHTML: () => [{ tag: 'sub' }],
  renderHTML: () => ['sub', 0],
  addKeyboardShortcuts() {
    return { 'Mod-,': () => this.editor.commands.toggleMark(this.name) }
  },
})

const part = (name: 'entryStart' | 'entryEnd') =>
  Node.create({
    name,
    content: 'inline*',
    defining: true,
    parseHTML: () => [{ tag: `span.${name === 'entryStart' ? 'entry-start' : 'entry-end'}` }],
    renderHTML: () => ['span', { class: name === 'entryStart' ? 'entry-start' : 'entry-end' }, 0],
  })
export const EntryStart = part('entryStart')
export const EntryEnd = part('entryEnd')

/**
 * A line with a part on the left and a part flush right, such as a role and its dates. Tab
 * moves from the left part to the right one, Shift-Tab back, and Enter starts a paragraph
 * after the line.
 */
export const EntryLine = Node.create({
  name: 'entryLine',
  group: 'block',
  content: 'entryStart entryEnd',
  defining: true,
  // before lists, so Tab inside a dated line moves between its parts rather than indenting
  priority: 1000,
  parseHTML: () => [{ tag: 'div.entry-line' }],
  renderHTML: () => ['div', { class: 'entry-line' }, 0],
  addKeyboardShortcuts() {
    const inPart = (name: string) => this.editor.state.selection.$from.parent.type.name === name
    return {
      Tab: () => {
        if (!inPart('entryStart')) return false
        return this.editor.commands.setTextSelection(this.editor.state.selection.$from.after() + 1)
      },
      'Shift-Tab': () => {
        if (!inPart('entryEnd')) return false
        return this.editor.commands.setTextSelection(this.editor.state.selection.$from.before() - 1)
      },
      Enter: () => {
        const { $from } = this.editor.state.selection
        if (!['entryStart', 'entryEnd'].includes($from.parent.type.name)) return false
        const after = $from.after($from.depth - 1)
        return this.editor
          .chain()
          .insertContentAt(after, { type: 'paragraph' })
          .setTextSelection(after + 1)
          .run()
      },
    }
  },
})

/** A dated line with prompts in both parts, the left one selected to be typed over. */
export function insertEntryLine(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: 'entryLine',
      content: [
        { type: 'entryStart', content: [{ type: 'text', text: 'Role, Company' }] },
        { type: 'entryEnd', content: [{ type: 'text', text: '2022 – Present' }] },
      ],
    })
    .run()
  const { $from } = editor.state.selection
  // the cursor lands after the inserted line; select its left part's prompt
  editor.state.doc.nodesBetween(Math.max(0, $from.pos - 40), $from.pos, (node, pos) => {
    if (node.type.name === 'entryStart') {
      editor.commands.setTextSelection({ from: pos + 1, to: pos + 1 + node.content.size })
    }
  })
}

/* ----- find and replace ----- */

export type SearchMatch = { from: number; to: number }
export type SearchState = {
  term: string
  caseSensitive: boolean
  matches: SearchMatch[]
  /** The match shown as current; -1 when there are none. */
  current: number
}
export const searchKey = new PluginKey<SearchState>('search')

/** Every occurrence of the term, within each paragraph-like block. */
function findMatches(doc: ProseNode, term: string, caseSensitive: boolean): SearchMatch[] {
  if (!term) return []
  const needle = caseSensitive ? term : term.toLowerCase()
  const matches: SearchMatch[] = []
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true
    // one character per position: text as itself, line breaks as a newline
    const text = node.textBetween(0, node.content.size, '\n', '\n')
    const haystack = caseSensitive ? text : text.toLowerCase()
    for (let at = haystack.indexOf(needle); at >= 0; at = haystack.indexOf(needle, at + 1)) {
      matches.push({ from: pos + 1 + at, to: pos + 1 + at + needle.length })
      if (matches.length >= 1000) return false
    }
    return false
  })
  return matches
}

export const Search = Extension.create({
  name: 'search',
  addProseMirrorPlugins() {
    return [
      new Plugin<SearchState>({
        key: searchKey,
        state: {
          init: () => ({ term: '', caseSensitive: false, matches: [], current: -1 }),
          apply(tr, value) {
            const change = tr.getMeta(searchKey) as Partial<SearchState> | undefined
            if (!change && !tr.docChanged) return value
            const next = { ...value, ...change }
            const matches = findMatches(tr.doc, next.term, next.caseSensitive)
            const current = matches.length
              ? Math.min(Math.max(next.current, 0), matches.length - 1)
              : -1
            return { ...next, matches, current }
          },
        },
        props: {
          decorations(state) {
            const search = searchKey.getState(state)
            if (!search?.matches.length) return DecorationSet.empty
            return DecorationSet.create(
              state.doc,
              search.matches.map((match, index) =>
                Decoration.inline(match.from, match.to, {
                  class:
                    index === search.current
                      ? 'search-match search-match--current'
                      : 'search-match',
                }),
              ),
            )
          },
        },
      }),
    ]
  },
})

export const searchState = (editor: Editor): SearchState =>
  searchKey.getState(editor.state) ?? { term: '', caseSensitive: false, matches: [], current: -1 }

export function setSearch(editor: Editor, change: Partial<SearchState>) {
  editor.view.dispatch(editor.state.tr.setMeta(searchKey, change).setMeta('addToHistory', false))
}

/** Moves to the next or previous match, selecting it and scrolling it into view. */
export function stepSearch(editor: Editor, step: 1 | -1) {
  const { matches, current } = searchState(editor)
  if (!matches.length) return
  const next = (current + step + matches.length) % matches.length
  setSearch(editor, { current: next })
  editor.chain().setTextSelection(matches[next]).scrollIntoView().run()
}

export function replaceCurrent(editor: Editor, replacement: string) {
  const { matches, current } = searchState(editor)
  const match = matches[current]
  if (!match) return
  editor.chain().insertContentAt(match, replacement).run()
}

export function replaceAll(editor: Editor, replacement: string): number {
  const { matches } = searchState(editor)
  if (!matches.length) return 0
  // from the end, so earlier positions stay valid
  editor.commands.command(({ tr }) => {
    for (const match of [...matches].reverse()) {
      if (replacement) tr.insertText(replacement, match.from, match.to)
      else tr.delete(match.from, match.to)
    }
    return true
  })
  return matches.length
}

/* ----- page setup ----- */

/** Sets page-layout values on the document itself, so they save and export with it. */
export function setLayout(
  editor: Editor,
  values: Partial<
    Record<'margins' | 'lineHeight' | 'blockSpacing' | 'paragraphSpacing', number | number[] | null>
  >,
) {
  let tr = editor.state.tr
  for (const [key, value] of Object.entries(values)) tr = tr.setDocAttribute(key, value)
  editor.view.dispatch(tr)
}
