# Auto-run the Prisma demo seed (same as: pnpm db:seed).
# From repo root: .\tools\seed-db.ps1
# Requires DATABASE_URL in packages/db/.env (or env already set).

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Error 'pnpm is not on PATH.'
}

Write-Host 'pnpm db:seed' -ForegroundColor Cyan
pnpm db:seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host 'Done.' -ForegroundColor Green
