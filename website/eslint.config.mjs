import vitals from 'eslint-config-next/core-web-vitals'
import ts from 'eslint-config-next/typescript'

const config = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      'src/hairline/generated/**',
      'next-env.d.ts',
    ],
  },
  ...vitals,
  ...ts,
]

export default config
