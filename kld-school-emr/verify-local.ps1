$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host 'KLD School EMR local verification' -ForegroundColor Green

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js is not installed or is not available in PATH.'
}

node scripts/static-validate.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$healthUrl = 'http://localhost:5000/api/health'
try {
    $health = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 5
    Write-Host "PASS  Live API: $($health.data.api); database: $($health.data.database)" -ForegroundColor Green
    node scripts/smoke-test.mjs
    exit $LASTEXITCODE
}
catch {
    Write-Host "INFO  Source checks passed. Live API check was skipped because $healthUrl is not reachable." -ForegroundColor Yellow
    Write-Host 'Start XAMPP MySQL and run npm run dev, then execute npm run smoke.' -ForegroundColor Yellow
}
