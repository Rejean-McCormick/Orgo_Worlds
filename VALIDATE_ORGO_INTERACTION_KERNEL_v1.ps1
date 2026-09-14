$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "[1/6] Architecture boundaries"
node scripts/check-architecture.mjs

Write-Host "[2/6] Prisma client"
npm run db:generate

Write-Host "[3/6] API typecheck"
npm run typecheck -w api

Write-Host "[4/6] Unit tests"
npm run test -w api

if ($env:TEST_DATABASE_URL) {
  Write-Host "[5/6] Database migration + integration tests"
  $env:DATABASE_URL = $env:TEST_DATABASE_URL
  npm run db:migrate -w api
  npm run test:integration -w api
} else {
  Write-Warning "[5/6] TEST_DATABASE_URL is not set; integration tests skipped."
}

Write-Host "[6/6] Build"
npm run build -w api
Write-Host "Orgo Interaction Kernel v1 validation completed."
