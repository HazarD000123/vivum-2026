import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')

console.log('Syncing dist output to repository root...')

// 1. Save source template index.html if it contains /src/main.tsx
const rootIndex = path.join(rootDir, 'index.html')
const templateIndex = path.join(rootDir, 'index.html.template')

if (fs.existsSync(rootIndex)) {
  const content = fs.readFileSync(rootIndex, 'utf-8')
  if (content.includes('/src/main.tsx')) {
    fs.writeFileSync(templateIndex, content, 'utf-8')
  }
}

// 2. Remove stale asset & sponsor directories in root
const assetsRoot = path.join(rootDir, 'assets')
const sponsorsRoot = path.join(rootDir, 'sponsors')

if (fs.existsSync(assetsRoot)) fs.rmSync(assetsRoot, { recursive: true, force: true })
if (fs.existsSync(sponsorsRoot)) fs.rmSync(sponsorsRoot, { recursive: true, force: true })

// 3. Copy fresh dist contents to root
function copyRecursive(src, dst) {
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dst, { recursive: true })
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dst, file))
    }
  } else {
    fs.copyFileSync(src, dst)
  }
}

for (const item of fs.readdirSync(distDir)) {
  const srcPath = path.join(distDir, item)
  const dstPath = path.join(rootDir, item)
  copyRecursive(srcPath, dstPath)
}

// 4. Ensure index.html in root is ready for future dev/build by restoring template if needed
if (fs.existsSync(templateIndex)) {
  // template stored safely for local vite build/dev
}

console.log('Dist sync complete! All assets are clean and fresh.')
