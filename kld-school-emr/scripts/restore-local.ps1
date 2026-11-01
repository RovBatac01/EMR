[CmdletBinding(SupportsShouldProcess=$true, ConfirmImpact='High')]
param(
  [Parameter(Mandatory=$true)][string]$BackupZip,
  [string]$EnvironmentFile = "server\.env",
  [switch]$RestoreUploads,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Read-DotEnv([string]$Path) {
  if (-not (Test-Path $Path)) { throw "Environment file not found: $Path" }
  $values = @{}
  foreach ($line in Get-Content $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#') -or -not $trimmed.Contains('=')) { continue }
    $parts = $trimmed.Split('=', 2)
    $values[$parts[0].Trim()] = $parts[1].Trim().Trim('"').Trim("'")
  }
  return $values
}

function Resolve-MySqlTool([string]$Name) {
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }
  $xampp = "C:\xampp\mysql\bin\$Name.exe"
  if (Test-Path $xampp) { return $xampp }
  throw "$Name was not found. Install XAMPP or add the MySQL bin folder to PATH."
}

$resolvedZip = Resolve-Path $BackupZip
$envValues = Read-DotEnv $EnvironmentFile
$dbHost = if ($envValues.DB_HOST) { $envValues.DB_HOST } else { '127.0.0.1' }
$dbPort = if ($envValues.DB_PORT) { $envValues.DB_PORT } else { '3306' }
$dbUser = if ($envValues.DB_USER) { $envValues.DB_USER } else { 'root' }
$dbPassword = if ($null -ne $envValues.DB_PASSWORD) { $envValues.DB_PASSWORD } else { '' }
$uploadRelative = if ($envValues.UPLOAD_DIR) { $envValues.UPLOAD_DIR } else { 'uploads' }
$uploadPath = Join-Path (Join-Path $root 'server') $uploadRelative
$mysqlTool = Resolve-MySqlTool 'mysql'
$tempPath = Join-Path $env:TEMP "kld-emr-restore-$([guid]::NewGuid().ToString('N'))"
$credentialsFile = Join-Path $env:TEMP "kld-emr-mysql-$([guid]::NewGuid().ToString('N')).cnf"

if (-not $Force -and -not $PSCmdlet.ShouldProcess($resolvedZip, 'Restore database and optionally uploaded files')) {
  Write-Host 'Restore cancelled.'
  exit 0
}

try {
  New-Item -ItemType Directory -Path $tempPath | Out-Null
  Expand-Archive -Path $resolvedZip -DestinationPath $tempPath -Force
  $manifest = Get-ChildItem $tempPath -Filter 'backup-manifest.json' -Recurse | Select-Object -First 1
  if (-not $manifest) { throw 'The selected archive is not a recognized KLD School EMR backup.' }
  $sql = Get-ChildItem $tempPath -Filter '*.sql' -Recurse | Select-Object -First 1
  if (-not $sql -or $sql.Length -eq 0) { throw 'The backup does not contain a valid SQL dump.' }

  @(
    '[client]'
    "host=$dbHost"
    "port=$dbPort"
    "user=$dbUser"
    "password=$dbPassword"
  ) | Set-Content -Path $credentialsFile -Encoding ASCII

  Get-Content $sql.FullName -Raw | & $mysqlTool "--defaults-extra-file=$credentialsFile"
  if ($LASTEXITCODE -ne 0) { throw "Database restore failed with exit code $LASTEXITCODE." }

  if ($RestoreUploads) {
    $uploads = Get-ChildItem $tempPath -Directory -Filter 'uploads' -Recurse | Select-Object -First 1
    if (-not $uploads) { throw 'The backup does not contain an uploads directory.' }
    if (Test-Path $uploadPath) {
      $safetyCopy = "$uploadPath.before-restore-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
      Copy-Item $uploadPath $safetyCopy -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $uploadPath | Out-Null
    Copy-Item (Join-Path $uploads.FullName '*') $uploadPath -Recurse -Force
  }

  Write-Host 'Restore completed successfully. Run the application smoke test before reopening access.' -ForegroundColor Green
} catch {
  Write-Error "Restore failed: $($_.Exception.Message)"
  exit 1
} finally {
  Remove-Item $credentialsFile -Force -ErrorAction SilentlyContinue
  Remove-Item $tempPath -Recurse -Force -ErrorAction SilentlyContinue
}
