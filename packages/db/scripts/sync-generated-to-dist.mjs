import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcGen = path.join(pkgRoot, 'src', 'generated')
const destGen = path.join(pkgRoot, 'dist', 'db', 'src', 'generated')

fs.rmSync(destGen, { recursive: true, force: true })
fs.cpSync(srcGen, destGen, { recursive: true })
