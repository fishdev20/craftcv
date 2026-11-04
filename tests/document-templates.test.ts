import { describe, expect, it } from 'vitest'
import { documentText, pageLayout, parseDocument } from '../src/shared/document'
import { documentTemplate, documentTemplates } from '../src/renderer/features/documents/templates'

describe('document templates', () => {
  it('ships four original editable starter layouts', () => {
    expect(documentTemplates.map((template) => template.id)).toEqual([
      'standard-ats',
      'compact-developer',
      'academic',
      'modern-accent',
    ])
    for (const template of documentTemplates) {
      const document = parseDocument(template.createDocument())
      const content = documentText(document).toLowerCase()
      expect(content).toContain('your name')
      expect(content).toContain('experience')
      expect(content).toContain('education')
    }
  })

  it('makes the developer layout more compact than the ATS layout', () => {
    const standard = pageLayout(documentTemplate('standard-ats').createDocument())
    const compact = pageLayout(documentTemplate('compact-developer').createDocument())
    expect(compact.margins[0]).toBeLessThan(standard.margins[0])
    expect(compact.fontSize).toBeLessThan(standard.fontSize)
    expect(compact.blockSpacing).toBeLessThan(standard.blockSpacing ?? Infinity)
  })
})
