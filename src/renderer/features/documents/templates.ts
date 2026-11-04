import type { DocumentMark, DocumentNode } from '@shared/document'

export type DocumentTemplateId =
  | 'standard-ats'
  | 'compact-developer'
  | 'academic'
  | 'modern-accent'
  | 'jakes-resume'
  | 'rendercv-classic'
  | 'rendercv-sb2nov'
  | 'rendercv-moderncv'
  | 'rendercv-engineering-resumes'
  | 'rendercv-engineering-classic'
  | 'rendercv-harvard'
  | 'rendercv-ink'
  | 'rendercv-opal'
  | 'rendercv-ember'

export type DocumentTemplateOrigin = 'craftcv' | 'jakes-resume' | 'rendercv'

export type DocumentTemplate = {
  id: DocumentTemplateId
  name: string
  description: string
  documentName: string
  origin: DocumentTemplateOrigin
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

/**
 * Editable single-column re-implementations of Jake's Resume and RenderCV's built-in themes
 * (both MIT). Values follow each theme's source; fonts and sizes become the closest the
 * editor offers, and small caps become upper case. Attribution and the full list of changes
 * ship in THIRD_PARTY_NOTICES.md.
 */
type Font = 'Arial' | 'Georgia' | 'Times New Roman' | 'Verdana'
type SourceTheme = {
  font: Font
  /** A different face for the name, as Ember sets its name apart from the body. */
  nameFont?: Font
  fontSize: number
  margins: [number, number, number, number]
  lineHeight: number
  blockSpacing: number
  /** Name, headline and section titles; contacts use `contactColor` when it differs. */
  accent: string
  contactColor?: string
  nameSize: string
  nameAlign: 'left' | 'center'
  nameUpper?: boolean
  sectionSize: string
  sectionAlign: 'left' | 'center'
  sectionUpper?: boolean
  rule: 'before' | 'after' | 'none'
  separator: string
  /** Dates and locations in italics (sb2nov). */
  datesItalic?: boolean
  /** The role on an italic line of its own under the organisation (Ink, Ember). */
  roleOwnLine?: boolean
}

const BLACK = '#000000'
const inch = (value: number) => Math.round(value * 72 * 10) / 10
const all = (value: number): [number, number, number, number] => [value, value, value, value]

const sourceThemes = {
  jakes: {
    font: 'Times New Roman',
    fontSize: 10.5,
    margins: [inch(0.5), inch(0.5), inch(0.5), inch(0.5)],
    lineHeight: 1.2,
    blockSpacing: 3,
    accent: BLACK,
    nameSize: '24pt',
    nameAlign: 'center',
    nameUpper: true,
    sectionSize: '12pt',
    sectionAlign: 'left',
    sectionUpper: true,
    rule: 'after',
    separator: ' | ',
  },
  classic: {
    font: 'Arial',
    fontSize: 10,
    margins: all(inch(0.7)),
    lineHeight: 1.25,
    blockSpacing: 4,
    accent: '#004f90',
    nameSize: '28pt',
    nameAlign: 'center',
    sectionSize: '14pt',
    sectionAlign: 'left',
    rule: 'after',
    separator: '   ',
  },
  sb2nov: {
    font: 'Times New Roman',
    fontSize: 10,
    margins: all(inch(0.7)),
    lineHeight: 1.25,
    blockSpacing: 4,
    accent: BLACK,
    nameSize: '28pt',
    nameAlign: 'center',
    sectionSize: '14pt',
    sectionAlign: 'left',
    rule: 'after',
    separator: ' • ',
    datesItalic: true,
  },
  moderncv: {
    font: 'Georgia',
    fontSize: 10,
    margins: all(inch(0.7)),
    lineHeight: 1.25,
    blockSpacing: 4,
    accent: '#004f90',
    nameSize: '24pt',
    nameAlign: 'left',
    sectionSize: '14pt',
    sectionAlign: 'left',
    rule: 'before',
    separator: '   ',
  },
  engineeringResumes: {
    font: 'Georgia',
    fontSize: 10,
    margins: all(inch(0.7)),
    lineHeight: 1.2,
    blockSpacing: 3,
    accent: BLACK,
    nameSize: '24pt',
    nameAlign: 'center',
    sectionSize: '12pt',
    sectionAlign: 'left',
    rule: 'after',
    separator: ' | ',
  },
  engineeringClassic: {
    font: 'Arial',
    fontSize: 10,
    margins: all(inch(0.7)),
    lineHeight: 1.25,
    blockSpacing: 4,
    accent: '#004f90',
    nameSize: '28pt',
    nameAlign: 'left',
    sectionSize: '14pt',
    sectionAlign: 'left',
    rule: 'after',
    separator: '   ',
  },
  harvard: {
    font: 'Georgia',
    fontSize: 10,
    margins: all(inch(0.5)),
    lineHeight: 1.22,
    blockSpacing: 3,
    accent: BLACK,
    nameSize: '24pt',
    nameAlign: 'center',
    sectionSize: '12pt',
    sectionAlign: 'center',
    rule: 'after',
    separator: ' • ',
  },
  ink: {
    font: 'Georgia',
    fontSize: 10,
    margins: all(inch(0.6)),
    lineHeight: 1.22,
    blockSpacing: 3,
    accent: '#2a1852',
    contactColor: '#46326e',
    nameSize: '32pt',
    nameAlign: 'left',
    sectionSize: '14pt',
    sectionAlign: 'left',
    sectionUpper: true,
    rule: 'none',
    separator: ' | ',
    roleOwnLine: true,
  },
  opal: {
    font: 'Verdana',
    fontSize: 9.5,
    margins: all(inch(0.65)),
    lineHeight: 1.25,
    blockSpacing: 4,
    accent: '#00645a',
    contactColor: '#005048',
    nameSize: '24pt',
    nameAlign: 'center',
    sectionSize: '12pt',
    sectionAlign: 'center',
    sectionUpper: true,
    rule: 'none',
    separator: ' • ',
  },
  ember: {
    font: 'Arial',
    nameFont: 'Georgia',
    fontSize: 10,
    margins: all(inch(0.6)),
    lineHeight: 1.25,
    blockSpacing: 4,
    accent: '#9b2319',
    contactColor: '#644b44',
    nameSize: '28pt',
    nameAlign: 'center',
    sectionSize: '12pt',
    sectionAlign: 'center',
    sectionUpper: true,
    rule: 'none',
    separator: ' · ',
    roleOwnLine: true,
  },
} satisfies Record<string, SourceTheme>

function sourceResume(theme: SourceTheme): DocumentNode {
  const body = (value: string, marks: DocumentMark[] = []) =>
    styled(value, { fontFamily: theme.font }, marks)
  const dates = (value: string) =>
    theme.datesItalic ? body(value, [{ type: 'italic' }]) : body(value)
  const section = (title: string): DocumentNode[] => {
    const heading: DocumentNode = {
      type: 'heading',
      attrs: { level: 2, textAlign: theme.sectionAlign },
      content: [
        styled(theme.sectionUpper ? title.toUpperCase() : title, {
          fontFamily: theme.font,
          fontSize: theme.sectionSize,
          color: theme.accent,
        }),
      ],
    }
    const rule: DocumentNode = { type: 'horizontalRule' }
    return [
      ...(theme.rule === 'before' ? [rule] : []),
      heading,
      ...(theme.rule === 'after' ? [rule] : []),
    ]
  }
  const datedLine = (start: DocumentNode[], end: DocumentNode[]): DocumentNode => ({
    type: 'entryLine',
    content: [
      { type: 'entryStart', content: start },
      { type: 'entryEnd', content: end },
    ],
  })
  const entry = (
    organisation: string,
    role: string,
    place: string,
    when: string,
  ): DocumentNode[] =>
    theme.roleOwnLine
      ? [
          datedLine([body(organisation, [{ type: 'bold' }])], [dates(`${place} | ${when}`)]),
          paragraph([body(role, [{ type: 'italic' }])]),
        ]
      : [
          datedLine(
            [body(`${role}, ${organisation}`, [{ type: 'bold' }])],
            [dates(`${place} | ${when}`)],
          ),
        ]
  const bullets = (items: string[]): DocumentNode => ({
    type: 'bulletList',
    content: items.map((item) => ({ type: 'listItem', content: [paragraph([body(item)])] })),
  })
  const contacts = [
    'email@example.com',
    '+00 000 000 000',
    'linkedin.com/in/username',
    'github.com/username',
  ]
  return {
    type: 'doc',
    attrs: {
      margins: theme.margins,
      lineHeight: theme.lineHeight,
      blockSpacing: theme.blockSpacing,
      listIndent: 18,
      fontSize: theme.fontSize,
    },
    content: [
      {
        type: 'heading',
        attrs: { level: 1, textAlign: theme.nameAlign },
        content: [
          styled(theme.nameUpper ? 'YOUR NAME' : 'Your name', {
            fontFamily: theme.nameFont ?? theme.font,
            fontSize: theme.nameSize,
            color: theme.accent,
          }),
        ],
      },
      paragraph(
        [
          styled(contacts.join(theme.separator), {
            fontFamily: theme.font,
            color: theme.contactColor ?? theme.accent,
          }),
        ],
        theme.nameAlign,
      ),
      ...section('Education'),
      ...entry('University name', 'Degree or qualification', 'City, Country', '2018–2022'),
      bullets(['Relevant coursework, thesis, or distinction.']),
      ...section('Experience'),
      ...entry('Company name', 'Role title', 'City, Country', '2022–Present'),
      bullets([
        'Describe a relevant responsibility and the result it produced.',
        'Add a second contribution supported by evidence from your work.',
      ]),
      ...entry('Earlier company', 'Earlier role', 'City, Country', '2020–2022'),
      bullets(['Keep the most relevant contribution from this role.']),
      ...section('Projects'),
      paragraph([body('Project name', [{ type: 'bold' }]), dates(' | Technologies | Link')]),
      bullets(['State the problem, your implementation, and an outcome you can verify.']),
      ...section('Skills'),
      paragraph([body('Languages: ', [{ type: 'bold' }]), body('Add languages')]),
      paragraph([
        body('Frameworks and tools: ', [{ type: 'bold' }]),
        body('Add frameworks and tools'),
      ]),
    ],
  }
}

export const documentTemplates: DocumentTemplate[] = [
  {
    id: 'standard-ats',
    name: 'Standard ATS',
    description: 'A clear single-column CV for broad compatibility.',
    documentName: 'Standard ATS resume',
    origin: 'craftcv',
    createDocument: standardAts,
  },
  {
    id: 'compact-developer',
    name: 'Compact developer',
    description: 'A denser layout that gives skills and projects more room.',
    documentName: 'Compact developer resume',
    origin: 'craftcv',
    createDocument: compactDeveloper,
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'A calm serif layout for research, education, and detailed experience.',
    documentName: 'Academic CV',
    origin: 'craftcv',
    createDocument: academic,
  },
  {
    id: 'modern-accent',
    name: 'Modern accent',
    description: 'A structured CV with restrained color and clear section landmarks.',
    documentName: 'Modern accent CV',
    origin: 'craftcv',
    createDocument: modernAccent,
  },
  {
    id: 'jakes-resume',
    name: "Jake's Resume",
    description: 'The widely used one-page developer CV: serif, centred name, ruled sections.',
    documentName: "Jake's Resume CV",
    origin: 'jakes-resume',
    createDocument: () => sourceResume(sourceThemes.jakes),
  },
  {
    id: 'rendercv-classic',
    name: 'Classic',
    description: 'Clean sans-serif with a blue name and section titles.',
    documentName: 'RenderCV Classic CV',
    origin: 'rendercv',
    createDocument: () => sourceResume(sourceThemes.classic),
  },
  {
    id: 'rendercv-sb2nov',
    name: 'sb2nov',
    description: 'Black-and-white serif with ruled sections and italic dates.',
    documentName: 'RenderCV sb2nov CV',
    origin: 'rendercv',
    createDocument: () => sourceResume(sourceThemes.sb2nov),
  },
  {
    id: 'rendercv-moderncv',
    name: 'ModernCV',
    description: 'A left-aligned blue name with a rule leading into each section.',
    documentName: 'RenderCV ModernCV CV',
    origin: 'rendercv',
    createDocument: () => sourceResume(sourceThemes.moderncv),
  },
  {
    id: 'rendercv-engineering-resumes',
    name: 'Engineering Resumes',
    description: 'A compact black serif layout with pipe-separated contacts.',
    documentName: 'RenderCV Engineering Resumes CV',
    origin: 'rendercv',
    createDocument: () => sourceResume(sourceThemes.engineeringResumes),
  },
  {
    id: 'rendercv-engineering-classic',
    name: 'Engineering Classic',
    description: 'A left-aligned blue sans-serif layout with full-width rules.',
    documentName: 'RenderCV Engineering Classic CV',
    origin: 'rendercv',
    createDocument: () => sourceResume(sourceThemes.engineeringClassic),
  },
  {
    id: 'rendercv-harvard',
    name: 'Harvard',
    description: 'Traditional and dense: centred name and centred, ruled sections.',
    documentName: 'RenderCV Harvard CV',
    origin: 'rendercv',
    createDocument: () => sourceResume(sourceThemes.harvard),
  },
  {
    id: 'rendercv-ink',
    name: 'Ink',
    description: 'A literary serif in deep purple, with the role on its own italic line.',
    documentName: 'RenderCV Ink CV',
    origin: 'rendercv',
    createDocument: () => sourceResume(sourceThemes.ink),
  },
  {
    id: 'rendercv-opal',
    name: 'Opal',
    description: 'A calm teal layout with centred, unruled section titles.',
    documentName: 'RenderCV Opal CV',
    origin: 'rendercv',
    createDocument: () => sourceResume(sourceThemes.opal),
  },
  {
    id: 'rendercv-ember',
    name: 'Ember',
    description: 'A warm red serif name over a clean sans-serif body.',
    documentName: 'RenderCV Ember CV',
    origin: 'rendercv',
    createDocument: () => sourceResume(sourceThemes.ember),
  },
]

export function documentTemplate(id: DocumentTemplateId): DocumentTemplate {
  const template = documentTemplates.find((candidate) => candidate.id === id)
  if (!template) throw new Error('Document template not found.')
  return template
}
