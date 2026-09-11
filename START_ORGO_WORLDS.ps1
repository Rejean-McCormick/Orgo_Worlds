[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

if (-not (Test-Path .\.env)) {
    throw 'Create .env from .env.example and set POSTGRES_PASSWORD and ORGO_ADMIN_PASSWORD first.'
}

Write-Host "`n=== PostgreSQL ===" -ForegroundColor Cyan
docker compose up -d postgres
if ($LASTEXITCODE -ne 0) { throw 'Unable to start PostgreSQL.' }

Write-Host "`n=== Database migration ===" -ForegroundColor Cyan
docker compose run --rm migrate
if ($LASTEXITCODE -ne 0) { throw 'Database migration failed.' }

Write-Host "`n=== Seed / administrator / Main World ===" -ForegroundColor Cyan
docker compose --profile setup run --rm seed
if ($LASTEXITCODE -ne 0) { throw 'Seed failed.' }

Write-Host "`n=== API + worker + web ===" -ForegroundColor Cyan
docker compose up -d --build api worker web
if ($LASTEXITCODE -ne 0) { throw 'Application startup failed.' }

Write-Host "`nORGO WORLDS = STARTED" -ForegroundColor Green
Write-Host 'Web : http://127.0.0.1:3100'
Write-Host 'API : http://127.0.0.1:4100'
Write-Host 'Desktop manager: py -3 .\Orgo_World_Manager.pyw'
