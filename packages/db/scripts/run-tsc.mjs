import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function findTscJs() {
  const local = path.join(pkgRoot, 'node_modules', 'typescript', 'lib', 'tsc.js')
  if (fs.existsSync(local)) {
    return local
  }

  let dir = pkgRoot
  for (let i = 0; i < 6; i++) {
    const pnpmDir = path.join(dir, 'node_modules', '.pnpm')
    if (fs.existsSync(pnpmDir)) {
      const candidates = fs
        .readdirSync(pnpmDir)
        .filter((name) => name.startsWith('typescript@'))
        .map((name) =>
          path.join(pnpmDir, name, 'node_modules', 'typescript', 'lib', 'tsc.js'),
        )
        .filter((file) => fs.existsSync(file))
        .sort()
      const picked = candidates.at(-1)
      if (picked) {
        return picked
      }
    }
    dir = path.join(dir, '..')
  }

  throw new Error(
    'Could not find TypeScript (typescript/lib/tsc.js). From the repo root, run pnpm install.',
  )
}

const tscJs = findTscJs()
const result = spawnSync(process.execPath, [tscJs, '-p', 'tsconfig.json', ...process.argv.slice(2)], {
  cwd: pkgRoot,
  stdio: 'inherit',
})

process.exit(result.status === null ? 1 : result.status)
