import type { DocumentMark, DocumentNode } from '@shared/document'

export type DocumentTemplateId = 'standard-ats' | 'compact-developer'

export type DocumentTemplate = {
  id: DocumentTemplateId
  name: string
  description: string
  documentName: string
  createDocument: () => DocumentNode
}

const text = (value: string, marks?: DocumentMark[]): DocumentNode => ({
  type: 'text',
  text: value,
  ...(marks?.length ? { marks } : {}),
})
const paragraph = (
  content: DocumentNode[],
  textAlign?: 'left' | 'center' | 'right' | 'justify',
): DocumentNode => ({
  type: 'paragraph',
  ...(textAlign ? { attrs: { textAlign } } : {}),
  content,
})
const heading = (value: string, level: 1 | 2 | 3, textAlign?: 'left' | 'center') => ({
  type: 'heading',
  attrs: { level, ...(textAlign ? { textAlign } : {}) },
  content: [text(value)],
})
const bulletList = (items: string[]): DocumentNode => ({
  type: 'bulletList',
  content: items.map((item) => ({
    type: 'listItem',
    content: [paragraph([text(item)])],
  })),
})
const bold = (value: string) => text(value, [{ type: 'bold' }])

function standardAts(): DocumentNode {
  return {
    type: 'doc',
    attrs: {
      margins: [50.4, 50.4, 50.4, 50.4],
      lineHeight: 1.35,
      blockSpacing: 6,
      listIndent: 22,
      fontSize: 10.5,
    },
    content: [
      heading('Your name', 1, 'center'),
      paragraph([text('Professional title · City, Country')], 'center'),
      paragraph([text('email@example.com · +00 000 000 000 · portfolio.example')], 'center'),
      { type: 'horizontalRule' },
      heading('Professional summary', 2),
      paragraph([
        text(
          'Write two or three lines about your experience, strongest skills, and the work you want to do next.',
        ),
      ]),
      heading('Experience', 2),
      paragraph([bold('Role title'), text(' · Company · City · 2022–Present')]),
      bulletList([
        'Describe a relevant responsibility and the result it produced.',
        'Add another achievement supported by evidence from your work.',
      ]),
      paragraph([bold('Earlier role'), text(' · Company · City · 2020–2022')]),
      bulletList(['Summarise the most relevant contribution from this role.']),
      heading('Projects', 2),
      paragraph([bold('Project name'), text(' · Technologies')]),
      bulletList(['Explain what you built, your contribution, and the evidence for it.']),
      heading('Skills', 2),
      paragraph([
        text('Languages: '),
        text('Add languages · '),
        text('Tools: '),
        text('Add tools'),
      ]),
      heading('Education', 2),
      paragraph([bold('Degree or qualification'), text(' · Institution · Year')]),
    ],
  }
}

function compactDeveloper(): DocumentNode {
  return {
    type: 'doc',
    attrs: {
      margins: [36, 40, 36, 40],
      lineHeight: 1.22,
      blockSpacing: 4,
      listIndent: 18,
      fontSize: 9.5,
    },
    content: [
      heading('Your name', 1),
      paragraph([bold('Software developer'), text(' · City, Country')]),
      paragraph([text('email@example.com · github.com/username · portfolio.example')]),
      { type: 'horizontalRule' },
      heading('Profile', 2),
      paragraph([
        text(
          'Summarise your technical focus, product experience, and the kind of problems you solve.',
        ),
      ]),
      heading('Technical skills', 2),
      paragraph([bold('Languages: '), text('Add languages')]),
      paragraph([bold('Frameworks: '), text('Add frameworks')]),
      paragraph([bold('Platforms and tools: '), text('Add platforms and tools')]),
      heading('Experience', 2),
      paragraph([bold('Role title · Company'), text(' · 2022–Present')]),
      bulletList([
        'Lead with the strongest evidence-backed contribution.',
        'Name the system, service, or workflow you improved and how.',
      ]),
      heading('Selected projects', 2),
      paragraph([bold('Project name'), text(' · Repository or product · Technologies')]),
      bulletList(['State the problem, your implementation, and an outcome you can verify.']),
      paragraph([bold('Project name'), text(' · Repository or product · Technologies')]),
      bulletList(['Add a second project only when it strengthens this application.']),
      heading('Education', 2),
      paragraph([bold('Degree or qualification'), text(' · Institution · Year')]),
    ],
  }
}

export const documentTemplates: DocumentTemplate[] = [
  {
    id: 'standard-ats',
    name: 'Standard ATS',
    description: 'A clear single-column CV for broad compatibility.',
    documentName: 'Standard ATS resume',
    createDocument: standardAts,
  },
  {
    id: 'compact-developer',
    name: 'Compact developer',
    description: 'A denser layout that gives skills and projects more room.',
    documentName: 'Compact developer resume',
    createDocument: compactDeveloper,
  },
]

export function documentTemplate(id: DocumentTemplateId): DocumentTemplate {
  const template = documentTemplates.find((candidate) => candidate.id === id)
  if (!template) throw new Error('Document template not found.')
  return template
}
