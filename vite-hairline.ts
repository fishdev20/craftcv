import type { Plugin } from 'vite'

/**
 * Hairline's engine and figures are plain scripts written for the hairline bench: the
 * kernel declares a global `HL`, and a figure ends by calling a global `hairline(figure)`.
 * This plugin turns them into ES modules at build time, so the files on disk stay exactly
 * as vendored and validated, and the renderer never needs `eval` under its CSP.
 */
export function hairline(): Plugin {
  return {
    name: 'craftcv-hairline',
    enforce: 'pre',
    transform(code, id) {
      const file = id.split('?')[0].replaceAll('\\', '/')
      if (file.endsWith('/src/renderer/common/hairline/kernel.js'))
        return { code: `${code}\nexport default HL\n`, map: null }
      if (/\/src\/renderer\/common\/hairline\/figures\/[^/]+\.js$/.test(file))
        return {
          code: `import HL from '../kernel.js'\nlet figure\nconst hairline = (value) => {\n  figure = value\n}\n${code}\nexport default figure\n`,
          map: null,
        }
    },
  }
}
