# start-campus-quest-lan.ps1
# Campus Quest LAN Startup Script
# Discovers the computer's LAN IP address and starts the backend server
# on 0.0.0.0:3000 so Android devices on the same Wi-Fi can connect.
# Run this script before deploying/testing the Android APK.

param(
    [string]$ServerPort = 3000,
    [string]$ServerScript = 'server.ts'
)

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  Campus Quest - LAN Server Startup' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

# Check if tsx is available
$tsxPath = Join-Path (Get-Location) 'node_modules' '.bin' 'tsx.cmd'
if (-not (Test-Path $tsxPath)) {
    $tsxPath = Join-Path (Get-Location) 'node_modules' '.bin' 'tsx'
}
if (-not (Test-Path $tsxPath)) {
    Write-Error 'tsx not found in node_modules/.bin. Run `npm install` first.'
    exit 1
}

# Discover LAN IPv4 address (exclude loopback 127.0.0.1)
Write-Host 'Discovering LAN IP address...' -ForegroundColor Yellow
$lanIp = $null
$allIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.InterfaceAlias -notlike '*Loopback*' -and $_.PrefixOrigin -ne 'WellKnown' }
foreach ($ip in $allIPs) {
    if ($ip.IPAddress -match '^192\.168\.' -or $ip.IPAddress -match '^10\.' -or $ip.IPAddress -match '^172\.(1[6-9]|2[0-9]|3[01])\.') {
        $lanIp = $ip.IPAddress
        break
    }
}
if (-not $lanIp) {
    # Fallback: first non-loopback IPv4
    $first = $allIPs | Select-Object -First 1
    if ($first) { $lanIp = $first.IPAddress }
}

if ($lanIp) {
    Write-Host "  LAN IP: $lanIp" -ForegroundColor Green
    Write-Host "  Server URL: http://$lanIp:$ServerPort" -ForegroundColor Green
    Write-Host ""
    Write-Host "  On your Android device, open the app and tap the Server" -ForegroundColor Yellow
    Write-Host "  config button (floating blue button with server icon)." -ForegroundColor Yellow
    Write-Host "  Enter: http://$lanIp:$ServerPort" -ForegroundColor Yellow
    Write-Host "  Tap 'Test Connection', then 'Save & Connect'." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Warning 'No LAN IPv4 address found. Android devices may not be able to connect.'
    Write-Host "  Server URL: http://localhost:$ServerPort (localhost only)" -ForegroundColor Yellow
}

# Check if port is already in use
$portUsed = Get-NetTCPConnection -LocalPort $ServerPort -State Listen -ErrorAction SilentlyContinue
if ($portUsed) {
    Write-Host "  Port $ServerPort is already in use. Server may already be running." -ForegroundColor Yellow
    Write-Host "  If you want to restart, stop the existing process first." -ForegroundColor Yellow
    Write-Host ""
    Write-Host '========================================' -ForegroundColor Cyan
    Write-Host '  Server already running - press Ctrl+C to stop' -ForegroundColor Cyan
    Write-Host '========================================' -ForegroundColor Cyan
    # Wait indefinitely so the user can read the output
    while ($true) { Start-Sleep -Seconds 60 }
}

# Start the server
Write-Host "Starting server on 0.0.0.0:$ServerPort..." -ForegroundColor Green
Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  Press Ctrl+C to stop the server' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

& $tsxPath $ServerScript
