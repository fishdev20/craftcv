import js from '@eslint/js'
import ts from 'typescript-eslint'
import hooks from 'eslint-plugin-react-hooks'
export default ts.config(
  {
    ignores: ['out/**', 'release/**', 'node_modules/**', 'src/renderer/common/hairline/kernel.js'],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': hooks },
    rules: { ...hooks.configs.recommended.rules, '@typescript-eslint/no-explicit-any': 'error' },
  },
  {
    files: ['src/renderer/common/hairline/figures/*.js'],
    languageOptions: { globals: { HL: 'readonly', hairline: 'readonly' } },
  },
  {
    files: ['scripts/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
        window: 'readonly',
        document: 'readonly',
      },
    },
  },
)
