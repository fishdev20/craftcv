import type { DocumentMark, DocumentNode } from '@shared/document'

export type DocumentTemplateId = 'standard-ats' | 'compact-developer' | 'academic' | 'modern-accent'

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
const bulletList = (items: string[]): DocumentNode => ({
  type: 'bulletList',
  content: items.map((item) => ({
    type: 'listItem',
    content: [paragraph([text(item)])],
  })),
})
const bold = (value: string) => text(value, [{ type: 'bold' }])
const styled = (value: string, attrs: Record<string, string>, marks: DocumentMark[] = []) =>
  text(value, [...marks, { type: 'textStyle', attrs }])
const sectionHeading = (
  value: string,
  options: { color?: string; fontFamily?: string; size?: string } = {},
) => ({
  type: 'heading',
  attrs: { level: 2 },
  content: [
    styled(value, {
      fontSize: options.size ?? '12pt',
      ...(options.color ? { color: options.color } : {}),
      ...(options.fontFamily ? { fontFamily: options.fontFamily } : {}),
    }),
  ],
})

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
      {
        type: 'heading',
        attrs: { level: 1, textAlign: 'center' },
        content: [styled('Your name', { fontSize: '20pt' })],
      },
      paragraph([text('Professional title | City, Country')], 'center'),
      paragraph([text('email@example.com | +00 000 000 000 | portfolio.example')], 'center'),
      { type: 'horizontalRule' },
      sectionHeading('Professional summary'),
      paragraph([
        text(
          'Write two or three lines about your experience, strongest skills, and the work you want to do next.',
        ),
      ]),
      sectionHeading('Experience'),
      paragraph([bold('Role title'), text(' | Company | City | 2022-Present')]),
      bulletList([
        'Describe a relevant responsibility and the result it produced.',
        'Add another achievement supported by evidence from your work.',
      ]),
      paragraph([bold('Earlier role'), text(' | Company | City | 2020-2022')]),
      bulletList(['Summarise the most relevant contribution from this role.']),
      sectionHeading('Projects'),
      paragraph([bold('Project name'), text(' | Technologies')]),
      bulletList(['Explain what you built, your contribution, and the evidence for it.']),
      sectionHeading('Skills'),
      paragraph([
        text('Languages: '),
        text('Add languages | '),
        text('Tools: '),
        text('Add tools'),
      ]),
      sectionHeading('Education'),
      paragraph([bold('Degree or qualification'), text(' | Institution | Year')]),
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
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [styled('Your name', { fontSize: '20pt' })],
      },
      paragraph([bold('Software developer'), text(' | City, Country')]),
      paragraph([text('email@example.com | github.com/username | portfolio.example')]),
      { type: 'horizontalRule' },
      sectionHeading('Profile', { color: '#17627a', size: '11pt' }),
      paragraph([
        text(
          'Summarise your technical focus, product experience, and the kind of problems you solve.',
        ),
      ]),
      sectionHeading('Technical skills', { color: '#17627a', size: '11pt' }),
      paragraph([bold('Languages: '), text('Add languages')]),
      paragraph([bold('Frameworks: '), text('Add frameworks')]),
      paragraph([bold('Platforms and tools: '), text('Add platforms and tools')]),
      sectionHeading('Experience', { color: '#17627a', size: '11pt' }),
      paragraph([bold('Role title | Company'), text(' | 2022-Present')]),
      bulletList([
        'Lead with the strongest evidence-backed contribution.',
        'Name the system, service, or workflow you improved and how.',
      ]),
      sectionHeading('Selected projects', { color: '#17627a', size: '11pt' }),
      paragraph([bold('Project name'), text(' | Repository or product | Technologies')]),
      bulletList(['State the problem, your implementation, and an outcome you can verify.']),
      paragraph([bold('Project name'), text(' | Repository or product | Technologies')]),
      bulletList(['Add a second project only when it strengthens this application.']),
      sectionHeading('Education', { color: '#17627a', size: '11pt' }),
      paragraph([bold('Degree or qualification'), text(' | Institution | Year')]),
    ],
  }
}

function academic(): DocumentNode {
  const serif = { fontFamily: 'Georgia' }
  return {
    type: 'doc',
    attrs: {
      margins: [48, 58, 48, 58],
      lineHeight: 1.3,
      blockSpacing: 5,
      listIndent: 20,
      fontSize: 10,
    },
    content: [
      {
        type: 'heading',
        attrs: { level: 1, textAlign: 'center' },
        content: [styled('Your name', { ...serif, fontSize: '20pt', color: '#172a46' })],
      },
      paragraph([styled('Research field or professional title', serif)], 'center'),
      paragraph([text('email@example.com | City, Country | portfolio.example')], 'center'),
      { type: 'horizontalRule' },
      sectionHeading('Profile', { ...serif, color: '#172a46' }),
      paragraph([
        text('Summarise your specialist interests, experience, and the work you want to pursue.'),
      ]),
      sectionHeading('Education', { ...serif, color: '#172a46' }),
      paragraph([bold('Degree or qualification'), text(' | Institution | Year')]),
      paragraph([text('Optional thesis, coursework, distinction, or academic focus.')]),
      sectionHeading('Experience', { ...serif, color: '#172a46' }),
      paragraph([bold('Role title'), text(' | Organisation | 2022-Present')]),
      bulletList([
        'Describe relevant work, research, teaching, or service.',
        'Add a result or responsibility that can be verified.',
      ]),
      sectionHeading('Selected work', { ...serif, color: '#172a46' }),
      paragraph([bold('Publication, project, or presentation'), text(' | Year')]),
      paragraph([text('Add a concise description and a link when relevant.')]),
      sectionHeading('Skills', { ...serif, color: '#172a46' }),
      paragraph([text('Methods: Add methods | Tools: Add tools | Languages: Add languages')]),
    ],
  }
}

function modernAccent(): DocumentNode {
  const accent = '#087e86'
  return {
    type: 'doc',
    attrs: {
      margins: [38, 44, 38, 44],
      lineHeight: 1.25,
      blockSpacing: 5,
      listIndent: 20,
      fontSize: 9.5,
    },
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [styled('YOUR NAME', { fontFamily: 'Verdana', fontSize: '20pt', color: accent })],
      },
      paragraph([bold('Professional title'), text(' | City, Country')]),
      paragraph([text('email@example.com | github.com/username | portfolio.example')]),
      { type: 'horizontalRule' },
      sectionHeading('Summary', { color: accent, fontFamily: 'Verdana', size: '11pt' }),
      paragraph([
        text('Introduce your focus, relevant experience, and the value you bring to the role.'),
      ]),
      sectionHeading('Experience', { color: accent, fontFamily: 'Verdana', size: '11pt' }),
      paragraph([bold('Role title | Company'), text(' | 2022-Present')]),
      bulletList([
        'Describe a contribution with specific, supportable context.',
        'Explain what changed because of your work without overstating ownership.',
      ]),
      paragraph([bold('Earlier role | Company'), text(' | 2020-2022')]),
      bulletList(['Keep the most relevant responsibility or result from this role.']),
      sectionHeading('Projects', { color: accent, fontFamily: 'Verdana', size: '11pt' }),
      paragraph([bold('Project name'), text(' | Technologies | Link')]),
      bulletList(['State the problem, your implementation, and evidence for the outcome.']),
      sectionHeading('Skills and education', {
        color: accent,
        fontFamily: 'Verdana',
        size: '11pt',
      }),
      paragraph([bold('Skills: '), text('Add relevant languages, frameworks, and tools')]),
      paragraph([bold('Education: '), text('Degree or qualification | Institution | Year')]),
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
  {
    id: 'academic',
    name: 'Academic',
    description: 'A calm serif layout for research, education, and detailed experience.',
    documentName: 'Academic CV',
    createDocument: academic,
  },
  {
    id: 'modern-accent',
    name: 'Modern accent',
    description: 'A structured CV with restrained color and clear section landmarks.',
    documentName: 'Modern accent CV',
    createDocument: modernAccent,
  },
]

export function documentTemplate(id: DocumentTemplateId): DocumentTemplate {
  const template = documentTemplates.find((candidate) => candidate.id === id)
  if (!template) throw new Error('Document template not found.')
  return template
}
