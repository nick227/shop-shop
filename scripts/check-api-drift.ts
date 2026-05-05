import fs from 'node:fs'
import path from 'node:path'

type Endpoint = {
  method: string
  path: string
  params: string[]
  operationId?: string
  requestBodyRequired: boolean
  hasRequestSchema: boolean
  hasResponseSchema: boolean
  successStatuses: string[]
  successStatusesWithSchema: string[]
  errorStatuses: string[]
  errorStatusesWithSchema: string[]
}

const scriptPath = process.argv[1] ? path.resolve(process.argv[1]) : __filename
const repoRoot = path.resolve(path.dirname(scriptPath), '..')
const openApiPath = path.join(repoRoot, 'docs', 'api', 'openapi.yaml')
const serverIndexPath = path.join(repoRoot, 'apps', 'server', 'src', 'index.ts')
const checkoutRoutePath = path.join(repoRoot, 'apps', 'server', 'src', 'routes', 'checkout.ts')

function readFile(filePath: string) {
  return fs.readFileSync(filePath, 'utf8')
}

function extractPathParams(routePath: string) {
  return [...routePath.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]!)
}

function normalizeServerPath(routePath: string) {
  return routePath.replace(/:([A-Za-z0-9_]+)/g, '{$1}')
}

function joinPaths(prefix: string, routePath: string) {
  return `${prefix.replace(/\/$/, '')}/${routePath.replace(/^\//, '')}`
}

function extractOpenApiServerUrl(openApi: string) {
  const match = openApi.match(/^\s*-\s+url:\s+(.+)$/m)
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? ''
}

function extractOpenApiEndpoints(openApi: string): Endpoint[] {
  const serverUrl = extractOpenApiServerUrl(openApi)
  const lines = openApi.split(/\r?\n/)
  const endpoints: Endpoint[] = []
  let currentPath: string | null = null
  let currentEndpoint: Endpoint | null = null
  let currentOperationIndent = 0
  let inPaths = false
  let inRequestBody = false
  let inResponses = false
  let currentResponseStatus: string | null = null

  function finishOperation() {
    if (currentEndpoint) {
      endpoints.push(currentEndpoint)
      currentEndpoint = null
      inRequestBody = false
      inResponses = false
      currentResponseStatus = null
    }
  }

  for (const line of lines) {
    if (line === 'paths:') {
      inPaths = true
      continue
    }

    if (inPaths && /^[A-Za-z0-9_-]+:/.test(line)) {
      finishOperation()
      break
    }

    const pathMatch = line.match(/^  (\/[^:]+):\s*$/)
    if (pathMatch) {
      finishOperation()
      currentPath = pathMatch[1]!
      continue
    }

    const methodMatch = line.match(/^(\s{4})(get|post|put|patch|delete):\s*$/)
    if (currentPath && methodMatch) {
      finishOperation()
      const fullPath = joinPaths(serverUrl, currentPath)
      currentOperationIndent = methodMatch[1]!.length
      currentEndpoint = {
        method: methodMatch[2]!.toUpperCase(),
        path: fullPath,
        params: extractPathParams(fullPath).sort(),
        requestBodyRequired: false,
        hasRequestSchema: false,
        hasResponseSchema: false,
        successStatuses: [],
        successStatusesWithSchema: [],
        errorStatuses: [],
        errorStatusesWithSchema: [],
      }
      continue
    }

    if (!currentEndpoint) {
      continue
    }

    const indent = line.match(/^ */)?.[0].length ?? 0
    if (line.trim() !== '' && indent <= currentOperationIndent) {
      finishOperation()
      continue
    }

    if (line.match(/^      requestBody:\s*$/)) {
      inRequestBody = true
      inResponses = false
      currentResponseStatus = null
      continue
    }

    if (line.match(/^      responses:\s*$/)) {
      inResponses = true
      inRequestBody = false
      currentResponseStatus = null
      continue
    }

    const operationIdMatch = line.match(/^\s{6}operationId:\s+(.+)\s*$/)
    if (operationIdMatch) {
      currentEndpoint.operationId = operationIdMatch[1]!.trim()
      continue
    }

    if (inRequestBody && line.match(/^\s{8}required:\s+true\s*$/)) {
      currentEndpoint.requestBodyRequired = true
      continue
    }

    const responseStatusMatch = line.match(/^\s{8}'?([1-5][0-9][0-9])'?:\s*$/)
    if (inResponses && responseStatusMatch) {
      currentResponseStatus = responseStatusMatch[1]!
      if (currentResponseStatus.startsWith('2')) {
        currentEndpoint.successStatuses.push(currentResponseStatus)
      } else if (currentResponseStatus.startsWith('4') || currentResponseStatus.startsWith('5')) {
        currentEndpoint.errorStatuses.push(currentResponseStatus)
      }
      continue
    }

    if (line.includes('schema:')) {
      if (inRequestBody) {
        currentEndpoint.hasRequestSchema = true
      }
      if (inResponses) {
        currentEndpoint.hasResponseSchema = true
        if (currentResponseStatus?.startsWith('2')) {
          currentEndpoint.successStatusesWithSchema.push(currentResponseStatus)
        }
        if (currentResponseStatus?.startsWith('4') || currentResponseStatus?.startsWith('5')) {
          currentEndpoint.errorStatusesWithSchema.push(currentResponseStatus)
        }
      }
    }

    if (inResponses && currentResponseStatus && line.match(/^\s{10}\$ref:\s+['"]?#\/components\/responses\//)) {
      currentEndpoint.hasResponseSchema = true
      if (currentResponseStatus.startsWith('2')) {
        currentEndpoint.successStatusesWithSchema.push(currentResponseStatus)
      }
      if (currentResponseStatus.startsWith('4') || currentResponseStatus.startsWith('5')) {
        currentEndpoint.errorStatusesWithSchema.push(currentResponseStatus)
      }
    }
  }

  finishOperation()
  return endpoints
}

function extractCheckoutPrefix(indexSource: string) {
  const match = indexSource.match(/register\(\s*checkoutRoutes\s*,\s*\{\s*prefix:\s*['"`]([^'"`]+)['"`]/s)
  if (!match) {
    throw new Error('Could not find checkoutRoutes registration prefix in apps/server/src/index.ts')
  }
  return match[1]!
}

function extractServerCheckoutEndpoints(routeSource: string, prefix: string): Endpoint[] {
  const routeRegex = /\b(?:fastify|f)\.(get|post|put|patch|delete)\s*(?:<[\s\S]*?>)?\s*\(\s*['"`]([^'"`]+)['"`]/g
  return [...routeSource.matchAll(routeRegex)].map((match) => {
    const fullPath = normalizeServerPath(joinPaths(prefix, match[2]!))
    return {
      method: match[1]!.toUpperCase(),
      path: fullPath,
      params: extractPathParams(fullPath).sort(),
      requestBodyRequired: false,
      hasRequestSchema: false,
      hasResponseSchema: false,
      successStatuses: [],
      successStatusesWithSchema: [],
      errorStatuses: [],
      errorStatusesWithSchema: [],
    }
  })
}

function endpointKey(endpoint: Endpoint) {
  return `${endpoint.method} ${endpoint.path}`
}

function sameParams(left: string[], right: string[]) {
  return left.length === right.length && left.every((param, index) => param === right[index])
}

function extractSchemaBlock(openApi: string, schemaName: string) {
  const match = openApi.match(new RegExp(`^    ${schemaName}:\\n([\\s\\S]*?)(?=^    [A-Za-z0-9_]+:|^  [A-Za-z0-9_]+:|\\z)`, 'm'))
  return match?.[1] ?? ''
}

function validateGlobalSchemaCompleteness(openApi: string, failures: string[]) {
  const errorBlock = extractSchemaBlock(openApi, 'ErrorResponse')
  const hasErrorRequired =
    /required:\s*\[[^\]]*\berror\b[^\]]*\bmessage\b[^\]]*\]/.test(errorBlock) ||
    /required:\s*\n(?:\s*-\s+\w+\s*\n?)*\s*-\s+error\s*\n(?:\s*-\s+\w+\s*\n?)*\s*-\s+message/.test(errorBlock)
  if (!hasErrorRequired) {
    failures.push('ErrorResponse schema must require error and message')
  }

  for (const schemaName of ['CheckoutStatus', 'CartStatus', 'OrderStatus', 'PaymentStatus']) {
    const schemaBlock = extractSchemaBlock(openApi, schemaName)
    if (!/enum:/.test(schemaBlock)) {
      failures.push(`${schemaName} schema must define an enum`)
    }
    if (!/x-state-transitions:/.test(schemaBlock)) {
      failures.push(`${schemaName} schema must define x-state-transitions`)
    }
  }
}

const openApi = readFile(openApiPath)
const indexSource = readFile(serverIndexPath)
const checkoutSource = readFile(checkoutRoutePath)

const specEndpoints = extractOpenApiEndpoints(openApi).filter((endpoint) =>
  endpoint.path.startsWith('/api/v1/checkout/'),
)
const serverEndpoints = extractServerCheckoutEndpoints(checkoutSource, extractCheckoutPrefix(indexSource))

const specByKey = new Map(specEndpoints.map((endpoint) => [endpointKey(endpoint), endpoint]))
const serverByKey = new Map(serverEndpoints.map((endpoint) => [endpointKey(endpoint), endpoint]))
const failures: string[] = []

validateGlobalSchemaCompleteness(openApi, failures)

for (const endpoint of serverEndpoints) {
  const match = specByKey.get(endpointKey(endpoint))
  if (!match) {
    failures.push(`Missing from OpenAPI: ${endpointKey(endpoint)}`)
    continue
  }
  if (!sameParams(endpoint.params, match.params)) {
    failures.push(
      `Path params mismatch for ${endpointKey(endpoint)}: server [${endpoint.params.join(', ')}], spec [${match.params.join(', ')}]`,
    )
  }
  if (endpoint.method !== 'GET' && !match.hasRequestSchema) {
    failures.push(`Missing request body schema in OpenAPI: ${endpointKey(endpoint)}`)
  }
  if (endpoint.method !== 'GET' && !match.requestBodyRequired) {
    failures.push(`Missing required requestBody in OpenAPI: ${endpointKey(endpoint)}`)
  }
  if (!match.hasResponseSchema) {
    failures.push(`Missing response schema in OpenAPI: ${endpointKey(endpoint)}`)
  }
  if (!match.operationId) {
    failures.push(`Missing operationId in OpenAPI: ${endpointKey(endpoint)}`)
  }
  if (match.successStatuses.length === 0) {
    failures.push(`Missing 2xx response in OpenAPI: ${endpointKey(endpoint)}`)
  }
  for (const status of match.successStatuses) {
    if (!match.successStatusesWithSchema.includes(status)) {
      failures.push(`Missing schema for ${status} response in OpenAPI: ${endpointKey(endpoint)}`)
    }
  }
  for (const status of ['400', '401', '500']) {
    if (!match.errorStatuses.includes(status)) {
      failures.push(`Missing ${status} error response in OpenAPI: ${endpointKey(endpoint)}`)
    }
  }
  for (const status of match.errorStatuses) {
    if (!match.errorStatusesWithSchema.includes(status)) {
      failures.push(`Missing schema for ${status} error response in OpenAPI: ${endpointKey(endpoint)}`)
    }
  }
}

for (const endpoint of specEndpoints) {
  if (!serverByKey.has(endpointKey(endpoint))) {
    failures.push(`Missing from server checkout routes: ${endpointKey(endpoint)}`)
  }
}

if (failures.length > 0) {
  console.error('API drift detected:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(`API drift check passed for ${serverEndpoints.length} checkout endpoints.`)
