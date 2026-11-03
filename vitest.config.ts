import { defineConfig } from 'vitest/config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { hairline } from './vite-hairline'

const { version } = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as { version: string }
export default defineConfig({
  plugins: [hairline()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  resolve: { alias: { '@': resolve('src/renderer'), '@shared': resolve('src/shared') } },
  test: { environment: 'node', include: ['tests/**/*.test.{ts,tsx}'], testTimeout: 20000 },
})
