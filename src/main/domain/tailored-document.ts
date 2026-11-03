import type { Resume, Suggestion } from '../../shared/contracts'
import { textDocument, type DocumentNode } from '../../shared/document'

const SECTION_TITLE = 'Selected project experience'

/** The base CV (or a blank page) followed by the approved bullets under their own heading. */
export function tailoredDocument(
  base: Resume | undefined,
  approved: Suggestion[],
): { name: string; document: DocumentNode } {
  const document = base?.document ?? textDocument('')
  return {
    name: base ? `${base.name} · tailored` : 'Tailored resume',
    document: {
      type: 'doc',
      content: [
        ...(document.content ?? []),
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: SECTION_TITLE }] },
        {
          type: 'bulletList',
          content: approved.map((s) => ({
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: s.text }] }],
          })),
        },
      ],
    },
  }
}

/** The plain-text resume for a session export: the CV text, then the approved bullets. */
export function tailoredText(base: Resume | undefined, approved: Suggestion[]): string {
  return [base?.text ?? 'Resume', '', SECTION_TITLE, ...approved.map((b) => `• ${b.text}`)].join(
    '\n',
  )
}
