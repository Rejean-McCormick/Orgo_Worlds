$ErrorActionPreference = 'Stop'

$Kx = 'C:\mycode\Konnaxion\Konnaxion_Worlds'
$Orgo = 'C:\mycode\Orgo\Orgo'
$Backend = Join-Path $Kx 'backend'
$KxPython = Join-Path $Backend '.venv\Scripts\python.exe'

function Assert-LastExitCode([string]$Step) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Step a échoué (code $LASTEXITCODE)."
    }
}

Write-Host '=== Orgo ↔ Konnaxion bridge validation v2 ===' -ForegroundColor Cyan

$Required = @(
    (Join-Path $Backend 'konnaxion\ethikos\orgo_bridge_contract.py'),
    (Join-Path $Backend 'konnaxion\ethikos\orgo_bridge_views.py'),
    (Join-Path $Backend 'konnaxion\ethikos\orgo_bridge_urls.py'),
    (Join-Path $Backend 'konnaxion\ethikos\migrations\0006_orgo_impact_publication.py'),
    (Join-Path $Orgo 'tools\scenario-injector\lib.mjs')
)
foreach ($Path in $Required) {
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Fichier absent: $Path"
    }
}
Write-Host '[PASS] fichiers attendus' -ForegroundColor Green

if (Test-Path -LiteralPath $KxPython) {
    Push-Location $Backend
    try {
        $oldPythonPath = $env:PYTHONPATH
        $env:PYTHONPATH = $Backend
        & $KxPython -m unittest konnaxion.ethikos.tests.test_orgo_bridge_contract -v
        Assert-LastExitCode 'tests contrat Konnaxion'

        & $KxPython manage.py makemigrations ethikos --check --dry-run
        Assert-LastExitCode 'makemigrations --check'

        & $KxPython manage.py check
        Assert-LastExitCode 'manage.py check'
        $env:PYTHONPATH = $oldPythonPath
    }
    finally {
        Pop-Location
    }
    Write-Host '[PASS] Konnaxion contract/migration/check' -ForegroundColor Green
}
else {
    Write-Host '[SKIP] backend\.venv absent; lance RUN_backend_local.bat une fois ou utilise le Bridge Manager.' -ForegroundColor Yellow
}

Push-Location $Orgo
try {
    node --check .\tools\scenario-injector\lib.mjs
    Assert-LastExitCode 'node --check lib.mjs'
    node --test .\tools\scenario-injector\tests\lib.test.mjs
    Assert-LastExitCode 'Scenario Injector tests'
}
finally {
    Pop-Location
}
Write-Host '[PASS] Scenario Injector' -ForegroundColor Green

Write-Host '=== VALIDATION TERMINÉE ===' -ForegroundColor Cyan
