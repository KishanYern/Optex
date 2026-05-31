# Start the rnd-explorer backend and frontend together.
# Ctrl+C (or closing the window) stops both processes and their children.

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

function Stop-Tree {
    param([int]$ProcessId)
    if (-not $ProcessId) { return }
    # taskkill /T walks the process tree, so npm + its node child both die.
    cmd /c "taskkill /T /F /PID $ProcessId" 2>$null | Out-Null
}

Write-Host "starting backend  -> http://localhost:8000" -ForegroundColor Cyan
$backend = Start-Process -PassThru -NoNewWindow `
    -FilePath "python" `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000" `
    -WorkingDirectory (Join-Path $root "backend")

Write-Host "starting frontend -> http://localhost:3000" -ForegroundColor Cyan
$frontend = Start-Process -PassThru -NoNewWindow `
    -FilePath "npm.cmd" `
    -ArgumentList "run", "dev" `
    -WorkingDirectory (Join-Path $root "frontend")

Write-Host ""
Write-Host "running. backend pid=$($backend.Id), frontend pid=$($frontend.Id)." -ForegroundColor Green
Write-Host "press Ctrl+C to stop both." -ForegroundColor Green
Write-Host ""

try {
    while ($true) {
        if ($backend.HasExited)  { Write-Host "backend exited unexpectedly."  -ForegroundColor Yellow; break }
        if ($frontend.HasExited) { Write-Host "frontend exited unexpectedly." -ForegroundColor Yellow; break }
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host ""
    Write-Host "stopping..." -ForegroundColor Cyan
    Stop-Tree -ProcessId $backend.Id
    Stop-Tree -ProcessId $frontend.Id
    Write-Host "stopped." -ForegroundColor Green
}
