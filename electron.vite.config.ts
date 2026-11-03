import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { hairline } from './vite-hairline'

// the version the sidebar shows beside the name, from the one place it is set
const { version } = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as { version: string }
export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/main/index.ts'),
          scanner: resolve('src/main/scanning/scanner-worker.ts'),
          document: resolve('src/main/documents/document-worker.ts'),
        },
      },
    },
  },
  preload: {},
  renderer: {
    build: { minify: true },
    define: { __APP_VERSION__: JSON.stringify(version) },
    resolve: { alias: { '@': resolve('src/renderer'), '@shared': resolve('src/shared') } },
    plugins: [hairline(), react(), tailwindcss()],
  },
})
