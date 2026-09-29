import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  define: { __VERSION__: JSON.stringify(pkg.version) },
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
  },
})
