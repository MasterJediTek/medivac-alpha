# MediVacAlpha GitHub Push Script
# Double-click or run: PowerShell -ExecutionPolicy Bypass -File GITHUB_PUSH_NOW.ps1

$GH = "C:\Users\jedit\AppData\Local\Temp\gh_cli\bin\gh.exe"
$REPO_DIR = "C:\JEDI\Casttwo Medivac One Virtual Hospital App"

Write-Host ""
Write-Host "=== MediVacAlpha GitHub Push ===" -ForegroundColor Cyan
Write-Host ""

# Check if already authed
$authStatus = & $GH auth status 2>&1
if ($authStatus -match "Logged in") {
    Write-Host "Already logged in to GitHub!" -ForegroundColor Green
} else {
    Write-Host "Step 1: GitHub Authentication" -ForegroundColor Yellow
    Write-Host "This will open your browser to authorize. Watch for the code below..." -ForegroundColor White
    Write-Host ""
    & $GH auth login --hostname github.com --web
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Auth failed. Try again." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "Step 2: Creating GitHub repo 'medivac-alpha'..." -ForegroundColor Yellow
& $GH repo create medivac-alpha --public --description "MediVacAlpha - JEDITek Virtual Hospital Platform (React Native 0.81 / Expo SDK 54)" 2>&1
Write-Host "Repo created (or already exists)." -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Pushing code to GitHub..." -ForegroundColor Yellow
Set-Location $REPO_DIR
git remote remove origin 2>&1 | Out-Null
git remote add origin "https://github.com/stephenorazi/medivac-alpha.git"
git branch -M main
git push -u origin main --force
git tag v1.0.29 2>&1 | Out-Null
git push origin v1.0.29 2>&1 | Out-Null

Write-Host ""
Write-Host "=== DONE! ===" -ForegroundColor Green
Write-Host "Repo: https://github.com/stephenorazi/medivac-alpha" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to close"
