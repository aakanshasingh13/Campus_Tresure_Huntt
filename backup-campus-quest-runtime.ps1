# backup-campus-quest-runtime.ps1
# READ-ONLY export of runtime payments and registrations from Campus Quest server.
# DO NOT EXECUTE until explicitly approved.
# Connects only to localhost:3000. Uses only GET /api/admin/payments and GET /api/admin/registrations.
# Session token is prompted securely and never printed, logged, persisted, or placed on the command line.

param(
    [string]$BaseUrl = 'http://localhost:3000',
    [string]$BackupDir = 'backups'
)

# Never print or log the token
$VerbosePreference = 'SilentlyContinue'

# Prompt for session token securely (SecureString, never plaintext on command line)
$secureToken = Read-Host -AsSecureString -Prompt 'Enter superadmin session token'

# Convert to plaintext only inside this process for the HTTP Authorization header
$plainTokenPtr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
    $plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($plainTokenPtr)
}
finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($plainTokenPtr)
}

# Clear SecureString reference from variables
$secureToken = $null

if ([string]::IsNullOrWhiteSpace($plainToken)) {
    Write-Error 'Session token is required and must not be empty.'
    exit 1
}

# Create backup directory if missing
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Unique backup filenames with timestamp; refuse to overwrite existing files
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$paymentsBackup   = Join-Path $BackupDir "payments-runtime-backup-$timestamp.json"
$registrationsBackup = Join-Path $BackupDir "registrations-runtime-backup-$timestamp.json"
$manifestBackup   = Join-Path $BackupDir "export-manifest-$timestamp.json"

foreach ($f in @($paymentsBackup, $registrationsBackup, $manifestBackup)) {
    if (Test-Path $f) {
        Write-Error "Backup file already exists and will not be overwritten: $f"
        exit 1
    }
}

# Common headers; token is in plaintext only inside this process memory
$headers = @{
    'Authorization' = "Bearer $plainToken"
    'Content-Type'  = 'application/json'
}

# Clear plaintext token from variable as soon as headers are built
$plainToken = $null

# Helper: fetch endpoint, validate response is a proper object
function Get-JsonEndpoint {
    param([string]$Url, [string]$Label)
    try {
        $response = Invoke-RestMethod -Method Get -Uri $Url -Headers $headers -ContentType 'application/json' -ErrorAction Stop
        if ($null -eq $response) {
            Write-Error "$Label returned null response."
            return $null
        }
        if (-not ($response -is [System.Management.Automation.PSCustomObject] -or $response -is [System.Collections.IDictionary])) {
            Write-Error "$Label returned non-object JSON."
            return $null
        }
        return $response
    }
    catch {
        Write-Error "$Label request failed: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            Write-Error "HTTP status: $($_.Exception.Response.StatusCode)"
        }
        return $null
    }
}

# Fetch BOTH endpoints before writing anything
$paymentsResult = Get-JsonEndpoint "$BaseUrl/api/admin/payments" 'Payments'
if ($null -eq $paymentsResult) {
    exit 1
}

$registrationsResult = Get-JsonEndpoint "$BaseUrl/api/admin/registrations" 'Registrations'
if ($null -eq $registrationsResult) {
    exit 1
}

# Validate response properties are arrays (including zero or one record)
$paymentsArray = $paymentsResult.payments
$registrationsArray = $registrationsResult.registrations

if ($null -eq $paymentsArray) {
    Write-Error 'Payments response missing "payments" property.'
    exit 1
}
if ($paymentsArray -is [string]) {
    Write-Error 'Payments "payments" property is not an array.'
    exit 1
}
if ($paymentsArray -isnot [System.Array] -and $paymentsArray -isnot [System.Collections.IList]) {
    # Single object returned instead of array; wrap it
    $paymentsArray = @($paymentsArray)
}

if ($null -eq $registrationsArray) {
    Write-Error 'Registrations response missing "registrations" property.'
    exit 1
}
if ($registrationsArray -is [string]) {
    Write-Error 'Registrations "registrations" property is not an array.'
    exit 1
}
if ($registrationsArray -isnot [System.Array] -and $registrationsArray -isnot [System.Collections.IList]) {
    $registrationsArray = @($registrationsArray)
}

# Validate required record fields: id and eventId must exist on every record
function Validate-Records {
    param([System.Collections.IList]$Records, [string]$Label)
    foreach ($r in $Records) {
        if ($null -eq $r -or $r -is [string]) {
            Write-Error "$Label contains a null or string record."
            return $false
        }
        if (-not ($r.PSObject.Properties.Name -contains 'id')) {
            Write-Error "$Label record missing required field 'id'."
            return $false
        }
        if (-not ($r.PSObject.Properties.Name -contains 'eventId')) {
            Write-Error "$Label record missing required field 'eventId'."
            return $false
        }
        if ([string]::IsNullOrWhiteSpace($r.id) -or [string]::IsNullOrWhiteSpace($r.eventId)) {
            Write-Error "$Label record has empty 'id' or 'eventId'."
            return $false
        }
    }
    return $true
}

$paymentsValid = Validate-Records $paymentsArray 'Payments'
if (-not $paymentsValid) {
    exit 1
}

$registrationsValid = Validate-Records $registrationsArray 'Registrations'
if (-not $registrationsValid) {
    exit 1
}

# Collect unique event IDs (no payment-sensitive values)
$paymentEventIds = $paymentsArray | Where-Object { $_.eventId -and [string]::IsNullOrWhiteSpace($_.eventId) -eq $false } | Select-Object -ExpandProperty eventId -Unique
$registrationEventIds = $registrationsArray | Where-Object { $_.eventId -and [string]::IsNullOrWhiteSpace($_.eventId) -eq $false } | Select-Object -ExpandProperty eventId -Unique
$allEventIds = ($paymentEventIds + $registrationEventIds | Select-Object -Unique)

# Save backups (preserve all original record fields, UTF-8 JSON)
$writtenFiles = @()
$writeFailed = $false

try {
    $paymentsArray | ConvertTo-Json -Depth 10 | Set-Content -Path $paymentsBackup -Encoding UTF8
    $writtenFiles += $paymentsBackup
}
catch {
    $writeFailed = $true
    Write-Error "Failed to write payments backup: $($_.Exception.Message)"
}

try {
    $registrationsArray | ConvertTo-Json -Depth 10 | Set-Content -Path $registrationsBackup -Encoding UTF8
    $writtenFiles += $registrationsBackup
}
catch {
    $writeFailed = $true
    Write-Error "Failed to write registrations backup: $($_.Exception.Message)"
}

# Save manifest (no UTR values, no secrets, no tokens)
$manifest = [PSCustomObject]@{
    exportTimestamp    = (Get-Date -Format 'o')
    sourceBaseUrl      = $BaseUrl
    paymentsFile       = Split-Path $paymentsBackup -Leaf
    paymentsCount      = $paymentsArray.Count
    registrationsFile  = Split-Path $registrationsBackup -Leaf
    registrationsCount = $registrationsArray.Count
    eventIds           = $allEventIds
}

try {
    $manifest | ConvertTo-Json -Depth 5 | Set-Content -Path $manifestBackup -Encoding UTF8
    $writtenFiles += $manifestBackup
}
catch {
    $writeFailed = $true
    Write-Error "Failed to write manifest: $($_.Exception.Message)"
}

# Report results
if ($writeFailed) {
    Write-Error "Backup partially failed. Files successfully written:"
    foreach ($f in $writtenFiles) {
        Write-Host "  $f"
    }
    exit 1
}

Write-Host "Backup complete."
Write-Host "  Payments:      $($paymentsArray.Count) records -> $paymentsBackup"
Write-Host "  Registrations: $($registrationsArray.Count) records -> $registrationsBackup"
Write-Host "  Manifest:      -> $manifestBackup"
Write-Host "  Event IDs:     $($allEventIds -join ', ')"
