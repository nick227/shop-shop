import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const scriptPath = process.argv[1] ? path.resolve(process.argv[1]) : __filename
const repoRoot = path.resolve(path.dirname(scriptPath), '..')
const openApiPath = path.join(repoRoot, 'docs', 'api', 'openapi.yaml')
const generatedTypesPath = path.join(repoRoot, 'apps', 'web', 'src', 'types', 'api.ts')
const openApiTypescriptCli = path.join(repoRoot, 'node_modules', 'openapi-typescript', 'bin', 'cli.js')
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shop-shop-api-contract-'))
const tempTypesPath = path.join(tempDir, 'api.ts')

function normalize(content: string) {
  return content.replace(/\r\n/g, '\n').trim()
}

try {
  execFileSync(
    process.execPath,
    [openApiTypescriptCli, openApiPath, '-o', tempTypesPath],
    {
      cwd: repoRoot,
      stdio: 'pipe',
    },
  )

  const expected = normalize(fs.readFileSync(tempTypesPath, 'utf8'))
  const actual = normalize(fs.readFileSync(generatedTypesPath, 'utf8'))

  if (actual !== expected) {
    console.error('Generated API types are stale. Run pnpm run generate:api.')
    process.exit(1)
  }

  console.log('API contract test passed: generated frontend types match OpenAPI.')
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true })
}
