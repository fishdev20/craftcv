import type { DocumentMark, DocumentNode } from '@shared/document'

export type DocumentTemplateId =
  | 'standard-ats'
  | 'compact-developer'
  | 'academic'
  | 'modern-accent'
  | 'rover-base'
  | 'rover-star'
  | 'rover-fancy'
  | 'rover-milky'
  | 'rover-office'
  | 'rover-obsolete'
  | 'rover-academic'
  | 'rover-academic-publications'
  | 'rover-week-monday'
  | 'rover-week-tuesday'
  | 'rover-week-wednesday'
  | 'rover-week-thursday'
  | 'rover-week-sunday'

export type DocumentTemplateOrigin = 'craftcv' | 'rover-resume'

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
 * Editable single-column adaptations of Subidit's Rover Resume LaTeX designs (CC BY 4.0).
 * Attribution and the complete modification notice ship in THIRD_PARTY_NOTICES.md.
 */
type RoverTheme = {
  accent: string
  bodyFont?: 'Arial' | 'Georgia' | 'Times New Roman' | 'Verdana'
  fontSize: number
  headingFont?: 'Arial' | 'Georgia' | 'Times New Roman' | 'Verdana'
  headingSize: string
  lineHeight: number
  margins: [number, number, number, number]
  nameAlign?: 'left' | 'center'
  nameSize: string
  rule: 'before' | 'after' | 'none'
  sectionCase?: 'title' | 'upper'
  splitAccent?: boolean
}

const roverThemes = {
  base: {
    accent: '#202020',
    fontSize: 10.5,
    headingSize: '12pt',
    lineHeight: 1.26,
    margins: [54, 54, 54, 54],
    nameAlign: 'center',
    nameSize: '24pt',
    rule: 'after',
    sectionCase: 'upper',
  },
  star: {
    accent: '#141e61',
    fontSize: 9.5,
    headingSize: '12pt',
    lineHeight: 1.22,
    margins: [48, 54, 48, 54],
    nameAlign: 'center',
    nameSize: '28pt',
    rule: 'before',
    sectionCase: 'upper',
  },
  fancy: {
    accent: '#704214',
    fontSize: 9.5,
    headingFont: 'Verdana',
    headingSize: '12pt',
    lineHeight: 1.24,
    margins: [43, 47, 43, 47],
    nameAlign: 'center',
    nameSize: '28pt',
    rule: 'after',
    sectionCase: 'upper',
  },
  milky: {
    accent: '#303030',
    bodyFont: 'Georgia',
    fontSize: 10,
    headingFont: 'Arial',
    headingSize: '10pt',
    lineHeight: 1.34,
    margins: [72, 90, 58, 90],
    nameAlign: 'left',
    nameSize: '24pt',
    rule: 'before',
    sectionCase: 'upper',
  },
  office: {
    accent: '#0d47a1',
    fontSize: 9.5,
    headingSize: '12pt',
    lineHeight: 1.24,
    margins: [36, 46, 36, 46],
    nameAlign: 'left',
    nameSize: '24pt',
    rule: 'none',
    sectionCase: 'title',
  },
  obsolete: {
    accent: '#666666',
    fontSize: 9.5,
    headingSize: '11pt',
    lineHeight: 1.25,
    margins: [42, 46, 42, 46],
    nameAlign: 'left',
    nameSize: '24pt',
    rule: 'after',
    sectionCase: 'upper',
  },
  academic: {
    accent: '#202020',
    bodyFont: 'Times New Roman',
    fontSize: 10.5,
    headingFont: 'Times New Roman',
    headingSize: '12pt',
    lineHeight: 1.3,
    margins: [58, 58, 58, 58],
    nameAlign: 'center',
    nameSize: '20pt',
    rule: 'after',
    sectionCase: 'upper',
  },
  monday: {
    accent: '#666666',
    fontSize: 9.5,
    headingSize: '18pt',
    lineHeight: 1.22,
    margins: [48, 54, 48, 54],
    nameAlign: 'left',
    nameSize: '24pt',
    rule: 'none',
    sectionCase: 'upper',
  },
  tuesday: {
    accent: '#b42318',
    fontSize: 9.5,
    headingSize: '16pt',
    lineHeight: 1.22,
    margins: [48, 54, 48, 54],
    nameAlign: 'left',
    nameSize: '24pt',
    rule: 'none',
    sectionCase: 'title',
    splitAccent: true,
  },
  wednesday: {
    accent: '#728475',
    fontSize: 9.5,
    headingSize: '12pt',
    lineHeight: 1.22,
    margins: [48, 54, 48, 54],
    nameAlign: 'center',
    nameSize: '24pt',
    rule: 'before',
    sectionCase: 'upper',
  },
  thursday: {
    accent: '#303030',
    bodyFont: 'Georgia',
    fontSize: 10,
    headingFont: 'Arial',
    headingSize: '10pt',
    lineHeight: 1.34,
    margins: [60, 72, 52, 72],
    nameAlign: 'left',
    nameSize: '24pt',
    rule: 'before',
    sectionCase: 'upper',
  },
  sunday: {
    accent: '#202020',
    fontSize: 10,
    headingSize: '12pt',
    lineHeight: 1.28,
    margins: [48, 54, 48, 54],
    nameAlign: 'center',
    nameSize: '24pt',
    rule: 'after',
    sectionCase: 'upper',
  },
} satisfies Record<string, RoverTheme>

function roverText(
  value: string,
  theme: RoverTheme,
  options: { bold?: boolean; color?: string; fontSize?: string; italic?: boolean } = {},
) {
  const marks: DocumentMark[] = []
  if (options.bold) marks.push({ type: 'bold' })
  if (options.italic) marks.push({ type: 'italic' })
  return styled(
    value,
    {
      ...(theme.bodyFont ? { fontFamily: theme.bodyFont } : {}),
      ...(options.color ? { color: options.color } : {}),
      ...(options.fontSize ? { fontSize: options.fontSize } : {}),
    },
    marks,
  )
}

function roverBulletList(items: string[], theme: RoverTheme): DocumentNode {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [paragraph([roverText(item, theme)])],
    })),
  }
}

function roverSection(title: string, theme: RoverTheme): DocumentNode[] {
  const label = theme.sectionCase === 'upper' ? title.toUpperCase() : title
  const style = {
    color: theme.accent,
    fontSize: theme.headingSize,
    ...(theme.headingFont ? { fontFamily: theme.headingFont } : {}),
  }
  const content = theme.splitAccent
    ? [styled(label.slice(0, 3), style), styled(label.slice(3), { ...style, color: '#202020' })]
    : [styled(label, style)]
  const headingNode: DocumentNode = { type: 'heading', attrs: { level: 2 }, content }
  return [
    ...(theme.rule === 'before' ? [{ type: 'horizontalRule' } as DocumentNode] : []),
    headingNode,
    ...(theme.rule === 'after' ? [{ type: 'horizontalRule' } as DocumentNode] : []),
  ]
}

function roverHeader(theme: RoverTheme): DocumentNode[] {
  return [
    {
      type: 'heading',
      attrs: { level: 1, textAlign: theme.nameAlign ?? 'left' },
      content: [
        styled('Your name', {
          color: theme.accent,
          fontSize: theme.nameSize,
          ...(theme.headingFont ? { fontFamily: theme.headingFont } : {}),
        }),
      ],
    },
    paragraph(
      [roverText('Professional title | City, Country', theme, { italic: true })],
      theme.nameAlign ?? 'left',
    ),
    paragraph(
      [roverText('email@example.com | +00 000 000 000 | portfolio.example', theme)],
      theme.nameAlign ?? 'left',
    ),
  ]
}

function roverResume(theme: RoverTheme): DocumentNode {
  return {
    type: 'doc',
    attrs: {
      margins: theme.margins,
      lineHeight: theme.lineHeight,
      blockSpacing: theme.lineHeight > 1.3 ? 6 : 4,
      listIndent: 20,
      fontSize: theme.fontSize,
    },
    content: [
      ...roverHeader(theme),
      ...roverSection('Education', theme),
      paragraph([
        roverText('University name', theme, { bold: true }),
        roverText(' | Degree or qualification | 2024', theme),
      ]),
      paragraph([roverText('Relevant coursework, distinction, or academic focus.', theme)]),
      ...roverSection('Experience', theme),
      paragraph([
        roverText('Company name', theme, { bold: true }),
        roverText(' | City, Country', theme),
      ]),
      paragraph([
        roverText('Role title', theme, { italic: true }),
        roverText(' | 2022-Present', theme),
      ]),
      roverBulletList(
        [
          'Describe a relevant responsibility and the result it produced.',
          'Add a second contribution supported by evidence from your work.',
        ],
        theme,
      ),
      ...roverSection('Skills', theme),
      paragraph([
        roverText('Languages: ', theme, { bold: true }),
        roverText('Add languages | Frameworks: Add frameworks | Tools: Add tools', theme),
      ]),
      ...roverSection('Projects', theme),
      paragraph([
        roverText('Project name', theme, { bold: true }),
        roverText(' | Technologies | Link', theme),
      ]),
      roverBulletList(
        ['State the problem, your implementation, and an outcome you can verify.'],
        theme,
      ),
      ...roverSection('Certifications and awards', theme),
      paragraph([roverText('Certification or award | Issuer | Year', theme)]),
    ],
  }
}

function roverAcademicPublications(): DocumentNode {
  const theme = roverThemes.academic
  return {
    type: 'doc',
    attrs: {
      margins: theme.margins,
      lineHeight: 1.35,
      blockSpacing: 7,
      listIndent: 20,
      fontSize: 10.5,
    },
    content: [
      ...roverHeader(theme),
      ...roverSection('Research publications', theme),
      paragraph([
        roverText('Author name. ', theme, { bold: true }),
        roverText('Publication title. Journal or conference, year.', theme),
      ]),
      paragraph([
        roverText('Author name. ', theme, { bold: true }),
        roverText('Publication title. Journal or conference, year.', theme),
      ]),
      ...roverSection('Selected presentations', theme),
      paragraph([roverText('Presentation title | Event | Year', theme)]),
      ...roverSection('Research interests', theme),
      paragraph([roverText('Add methods, domains, and questions relevant to your work.', theme)]),
      ...roverSection('Education', theme),
      paragraph([
        roverText('Degree or qualification', theme, { bold: true }),
        roverText(' | Institution | Year', theme),
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
    id: 'rover-base',
    name: 'Base Rover',
    description: 'A minimal one-page structure with ruled uppercase sections.',
    documentName: 'Base Rover CV',
    origin: 'rover-resume',
    createDocument: () => roverResume(roverThemes.base),
  },
  {
    id: 'rover-star',
    name: 'Star Rover',
    description: 'A compact navy-accent layout with strong name hierarchy.',
    documentName: 'Star Rover CV',
    origin: 'rover-resume',
    createDocument: () => roverResume(roverThemes.star),
  },
  {
    id: 'rover-fancy',
    name: 'Fancy Rover',
    description: 'A dense sepia-accent layout with a bold display header.',
    documentName: 'Fancy Rover CV',
    origin: 'rover-resume',
    createDocument: () => roverResume(roverThemes.fancy),
  },
  {
    id: 'rover-milky',
    name: 'Milky Rover',
    description: 'A wide-margin serif layout with restrained typographic sections.',
    documentName: 'Milky Rover CV',
    origin: 'rover-resume',
    createDocument: () => roverResume(roverThemes.milky),
  },
  {
    id: 'rover-office',
    name: 'Office Rover',
    description: 'A blue-accent professional layout adapted without the original photo.',
    documentName: 'Office Rover CV',
    origin: 'rover-resume',
    createDocument: () => roverResume(roverThemes.office),
  },
  {
    id: 'rover-obsolete',
    name: 'Obsolete Rover',
    description: 'A restrained gray layout adapted to CraftCV’s single-column editor.',
    documentName: 'Obsolete Rover CV',
    origin: 'rover-resume',
    createDocument: () => roverResume(roverThemes.obsolete),
  },
  {
    id: 'rover-academic',
    name: 'Academic Rover',
    description: 'A traditional research CV for education, work, and selected publications.',
    documentName: 'Academic Rover CV',
    origin: 'rover-resume',
    createDocument: () => roverResume(roverThemes.academic),
  },
  {
    id: 'rover-academic-publications',
    name: 'Academic Rover: publications',
    description: 'A publication-led academic CV for longer research records.',
    documentName: 'Academic Rover publications CV',
    origin: 'rover-resume',
    createDocument: roverAcademicPublications,
  },
  {
    id: 'rover-week-monday',
    name: 'Week Rover: Monday',
    description: 'Oversized gray section titles with compact supporting text.',
    documentName: 'Week Rover Monday CV',
    origin: 'rover-resume',
    createDocument: () => roverResume(roverThemes.monday),
  },
  {
    id: 'rover-week-tuesday',
    name: 'Week Rover: Tuesday',
    description: 'Editorial section headings with a red opening accent.',
    documentName: 'Week Rover Tuesday CV',
    origin: 'rover-resume',
    createDocument: () => roverResume(roverThemes.tuesday),
  },
  {
    id: 'rover-week-wednesday',
    name: 'Week Rover: Wednesday',
    description: 'A muted sage layout with centered identity and compact rules.',
    documentName: 'Week Rover Wednesday CV',
    origin: 'rover-resume',
    createDocument: () => roverResume(roverThemes.wednesday),
  },
  {
    id: 'rover-week-thursday',
    name: 'Week Rover: Thursday',
    description: 'A spacious serif layout with small typographic section labels.',
    documentName: 'Week Rover Thursday CV',
    origin: 'rover-resume',
    createDocument: () => roverResume(roverThemes.thursday),
  },
  {
    id: 'rover-week-sunday',
    name: 'Week Rover: Sunday',
    description: 'A balanced classic layout with ruled uppercase sections.',
    documentName: 'Week Rover Sunday CV',
    origin: 'rover-resume',
    createDocument: () => roverResume(roverThemes.sunday),
  },
]

export function documentTemplate(id: DocumentTemplateId): DocumentTemplate {
  const template = documentTemplates.find((candidate) => candidate.id === id)
  if (!template) throw new Error('Document template not found.')
  return template
}
