param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Command,

    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Rest
)

$ErrorActionPreference = 'Stop'
$Cli = Join-Path $PSScriptRoot 'cli.mjs'

& node $Cli $Command @Rest
if ($LASTEXITCODE -ne 0) {
    throw "Orgo Worlds Scenario Bridge a échoué (code $LASTEXITCODE)."
}
