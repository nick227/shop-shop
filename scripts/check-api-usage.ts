import fs from 'node:fs'
import path from 'node:path'

const scriptPath = process.argv[1] ? path.resolve(process.argv[1]) : __filename
const repoRoot = path.resolve(path.dirname(scriptPath), '..')
const webSrc = path.join(repoRoot, 'apps', 'web', 'src')

const allowedFiles = new Set([
  path.normalize(path.join(webSrc, 'api', 'client.ts')),
  path.normalize(path.join(webSrc, 'shared', 'lib', 'clientErrorReporting.ts')),
])

const ignoredSegments = [
  `${path.sep}__tests__${path.sep}`,
  `${path.sep}features${path.sep}auth${path.sep}`,
  `${path.sep}pages${path.sep}admin${path.sep}`,
  `${path.sep}pages${path.sep}vendor${path.sep}`,
  `${path.sep}shared${path.sep}hooks${path.sep}hooks${path.sep}river${path.sep}`,
  `${path.sep}shared${path.sep}hooks${path.sep}hooks${path.sep}vendor${path.sep}`,
  `${path.sep}docs${path.sep}`,
  `${path.sep}scripts${path.sep}`,
  `${path.sep}types${path.sep}`,
]

type Violation = {
  file: string
  line: number
  text: string
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return walk(fullPath)
    }
    return fullPath
  })
}

function isSourceFile(filePath: string) {
  return /\.(ts|tsx)$/.test(filePath)
}

function isIgnored(filePath: string) {
  const normalized = path.normalize(filePath)
  return allowedFiles.has(normalized) || ignoredSegments.some((segment) => normalized.includes(segment))
}

function isInternalApiFetch(line: string) {
  const compact = line.replace(/\s+/g, ' ')
  return (
    /\bfetch\s*\(\s*['"`]\/(?:kitchen|cart|carts|orders)(?:\/|\?|['"`])/.test(compact) ||
    /\bfetch\s*\(\s*['"`]\/api\/(?:v1\/)?(?:kitchen|cart|carts|orders)(?:\/|\?|['"`])/.test(compact) ||
    /\bfetch\s*\(\s*['"`][^'"`]*\/api\/v1\/(?:kitchen|cart|carts|orders)(?:\/|\?|['"`])/.test(compact) ||
    /\bfetch\s*\(\s*['"`]http:\/\/localhost:\d+\/(?:api\/(?:v1\/)?)?(?:kitchen|cart|carts|orders)(?:\/|\?|['"`])/.test(compact)
  )
}

const violations: Violation[] = []

for (const filePath of walk(webSrc)) {
  if (!isSourceFile(filePath) || isIgnored(filePath)) {
    continue
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  lines.forEach((line, index) => {
    if (isInternalApiFetch(line)) {
      violations.push({
        file: path.relative(repoRoot, filePath).replace(/\\/g, '/'),
        line: index + 1,
        text: line.trim(),
      })
    }
  })
}

if (violations.length > 0) {
  console.error('Raw funnel-critical API fetch usage detected. Use apps/web/src/api/client.ts instead:')
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} ${violation.text}`)
  }
  process.exit(1)
}

console.log('API usage check passed: no raw kitchen/cart/order API fetch calls found outside approved API infrastructure.')
