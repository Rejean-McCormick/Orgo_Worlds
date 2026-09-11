[CmdletBinding()]
param(
    [int]$DbPort = 5435,
    [string]$ContainerName = 'orgo-worlds-validation-postgres'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Run-Step {
    param([Parameter(Mandatory)][string]$Name, [Parameter(Mandatory)][scriptblock]$Action)
    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) { throw "$Name failed (exit $LASTEXITCODE)" }
}

Run-Step 'Static architecture' { node .\scripts\check-architecture.mjs }
Run-Step 'Worlds invariants' { node .\scripts\check-worlds.mjs }

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker is required for the isolated PostgreSQL validation database.'
}

$password = 'orgo_worlds_validation_' + ([guid]::NewGuid().ToString('N'))
$existing = docker ps -a --filter "name=^/${ContainerName}$" --format '{{.Names}}'
if ($existing -eq $ContainerName) {
    Write-Host "Removing previous validation container $ContainerName" -ForegroundColor Yellow
    docker rm -f $ContainerName | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Unable to remove previous validation container.' }
}

Write-Host "`n=== PostgreSQL validation database ===" -ForegroundColor Cyan
docker run -d `
    --name $ContainerName `
    -e POSTGRES_DB=orgo_worlds_validation `
    -e POSTGRES_USER=orgo_worlds_validation `
    -e "POSTGRES_PASSWORD=$password" `
    -p "127.0.0.1:${DbPort}:5432" `
    postgres:16 | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Unable to start PostgreSQL validation container.' }

$ready = $false
for ($i = 0; $i -lt 40; $i++) {
    docker exec $ContainerName pg_isready -U orgo_worlds_validation -d orgo_worlds_validation *> $null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Milliseconds 500
}
if (-not $ready) { throw 'PostgreSQL validation database did not become ready.' }

if (-not (Test-Path .\node_modules)) {
    Run-Step 'Install npm dependencies' { npm install --no-audit --no-fund }
}

$env:TEST_DATABASE_URL = "postgresql://orgo_worlds_validation:$password@127.0.0.1:$DbPort/orgo_worlds_validation"
Run-Step 'Full Orgo Worlds local gate' { npm run validate:local }

Write-Host "`nORGO WORLDS PHASE 1-5 VALIDATION = PASS" -ForegroundColor Green
Write-Host "Validation database container kept as: $ContainerName" -ForegroundColor DarkGray
