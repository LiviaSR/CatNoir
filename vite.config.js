import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const headPath = resolve(__dirname, 'site/src/partials/head.html')
const headerPath = resolve(__dirname, 'site/src/partials/header.html')
const footerPath = resolve(__dirname, 'site/src/partials/footer.html')

export default defineConfig({
  root: 'site',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index:      resolve(__dirname, 'site/index.html'),
        contact:    resolve(__dirname, 'site/html/contact.html'),
        references: resolve(__dirname, 'site/html/references.html'),
        updates:    resolve(__dirname, 'site/html/updates.html'),
      }
    }
  },
  plugins: [
    {
      name: 'catnoir:shared-head',
      transformIndexHtml(html) {
        const sharedHead = readFileSync(headPath, 'utf-8')
        const header = readFileSync(headerPath, 'utf-8')
        const footer = readFileSync(footerPath, 'utf-8')
        return html
          .replace('<!-- @shared-head -->', sharedHead)
          .replace('<!-- @catnoir-header -->', header)
          .replace('<!-- @catnoir-footer -->', footer)
      }
    }
  ]
})
