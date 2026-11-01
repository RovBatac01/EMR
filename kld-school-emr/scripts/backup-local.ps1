[CmdletBinding()]
param(
  [string]$EnvironmentFile = "server\.env",
  [string]$Destination = "backups"
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
    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    $values[$key] = $value
  }
  return $values
}

function Resolve-MySqlTool([string]$Name) {
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }
  $xampp = "C:\xampp\mysql\bin\$Name.exe"
  if (Test-Path $xampp) { return $xampp }
  throw "$Name was not found. Start from a workstation with XAMPP installed or add the MySQL bin folder to PATH."
}

$envValues = Read-DotEnv $EnvironmentFile
$dbName = if ($envValues.DB_NAME) { $envValues.DB_NAME } else { 'kld_school_emr' }
$dbHost = if ($envValues.DB_HOST) { $envValues.DB_HOST } else { '127.0.0.1' }
$dbPort = if ($envValues.DB_PORT) { $envValues.DB_PORT } else { '3306' }
$dbUser = if ($envValues.DB_USER) { $envValues.DB_USER } else { 'root' }
$dbPassword = if ($null -ne $envValues.DB_PASSWORD) { $envValues.DB_PASSWORD } else { '' }
$uploadRelative = if ($envValues.UPLOAD_DIR) { $envValues.UPLOAD_DIR } else { 'uploads' }
$uploadPath = Join-Path (Join-Path $root 'server') $uploadRelative
$dumpTool = Resolve-MySqlTool 'mysqldump'

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$destinationPath = Join-Path $root $Destination
$workPath = Join-Path $destinationPath "kld-school-emr-$timestamp"
$zipPath = "$workPath.zip"
New-Item -ItemType Directory -Force -Path $workPath | Out-Null

$credentialsFile = Join-Path $env:TEMP "kld-emr-mysql-$([guid]::NewGuid().ToString('N')).cnf"
try {
  @(
    '[client]'
    "host=$dbHost"
    "port=$dbPort"
    "user=$dbUser"
    "password=$dbPassword"
  ) | Set-Content -Path $credentialsFile -Encoding ASCII

  $sqlPath = Join-Path $workPath "$dbName.sql"
  & $dumpTool "--defaults-extra-file=$credentialsFile" --single-transaction --routines --triggers --events --hex-blob --set-gtid-purged=OFF --databases $dbName --result-file=$sqlPath
  if ($LASTEXITCODE -ne 0) { throw "Database backup failed with exit code $LASTEXITCODE." }
  if (-not (Test-Path $sqlPath) -or (Get-Item $sqlPath).Length -eq 0) { throw 'Database backup file was not created.' }

  if (Test-Path $uploadPath) {
    Copy-Item $uploadPath (Join-Path $workPath 'uploads') -Recurse -Force
  } else {
    New-Item -ItemType Directory -Path (Join-Path $workPath 'uploads') | Out-Null
  }

  @{
    application = 'KLD School EMR'
    createdAt = (Get-Date).ToString('o')
    database = $dbName
    databaseHost = $dbHost
    includesUploads = $true
    version = (Get-Content (Join-Path $root 'VERSION') -Raw).Trim()
  } | ConvertTo-Json | Set-Content (Join-Path $workPath 'backup-manifest.json') -Encoding UTF8

  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
  Compress-Archive -Path (Join-Path $workPath '*') -DestinationPath $zipPath -CompressionLevel Optimal
  if (-not (Test-Path $zipPath)) { throw 'Backup archive was not created.' }
  Remove-Item $workPath -Recurse -Force
  Write-Host "Backup completed successfully:" -ForegroundColor Green
  Write-Host $zipPath
} catch {
  Write-Error "Backup failed: $($_.Exception.Message)"
  exit 1
} finally {
  Remove-Item $credentialsFile -Force -ErrorAction SilentlyContinue
}
