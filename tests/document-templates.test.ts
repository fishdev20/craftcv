import { describe, expect, it } from 'vitest'
import { documentText, pageLayout, parseDocument } from '../src/shared/document'
import { documentTemplate, documentTemplates } from '../src/renderer/features/documents/templates'

describe('document templates', () => {
  it("ships four originals, Jake's Resume and the RenderCV themes", () => {
    expect(documentTemplates.map((template) => template.id)).toEqual([
      'standard-ats',
      'compact-developer',
      'academic',
      'modern-accent',
      'jakes-resume',
      'rendercv-classic',
      'rendercv-sb2nov',
      'rendercv-moderncv',
      'rendercv-engineering-resumes',
      'rendercv-engineering-classic',
      'rendercv-harvard',
      'rendercv-ink',
      'rendercv-opal',
      'rendercv-ember',
    ])
    expect(documentTemplates.filter((template) => template.origin === 'craftcv')).toHaveLength(4)
    expect(documentTemplates.filter((template) => template.origin === 'jakes-resume')).toHaveLength(
      1,
    )
    expect(documentTemplates.filter((template) => template.origin === 'rendercv')).toHaveLength(9)
    for (const template of documentTemplates) {
      const document = parseDocument(template.createDocument())
      const content = documentText(document).toLowerCase()
      expect(content).toContain('your name')
      expect(content).toContain('education')
      expect(content).toMatch(/experience|research publications/)
    }
    for (const template of documentTemplates.filter((item) => item.origin !== 'craftcv')) {
      expect(template.createDocument().content?.some((node) => node.type === 'entryLine')).toBe(
        true,
      )
    }
  })

  it('makes the developer layout more compact than the ATS layout', () => {
    const standard = pageLayout(documentTemplate('standard-ats').createDocument())
    const compact = pageLayout(documentTemplate('compact-developer').createDocument())
    expect(compact.margins[0]).toBeLessThan(standard.margins[0])
    expect(compact.fontSize).toBeLessThan(standard.fontSize)
    expect(compact.blockSpacing).toBeLessThan(standard.blockSpacing ?? Infinity)
  })

  it("keeps each RenderCV theme's accent colour on its name", () => {
    const accent = (id: Parameters<typeof documentTemplate>[0]) =>
      documentTemplate(id).createDocument().content?.[0]?.content?.[0]?.marks?.[0]?.attrs?.color
    expect(accent('rendercv-classic')).toBe('#004f90')
    expect(accent('rendercv-ink')).toBe('#2a1852')
    expect(accent('rendercv-opal')).toBe('#00645a')
    expect(accent('rendercv-ember')).toBe('#9b2319')
    expect(accent('jakes-resume')).toBe('#000000')
  })
})
