# انقل مشروع VAR إلى مسار var\var1
# شغّل من PowerShell (يفضّل كمسؤول) بعد إغلاق Cursor وإيقاف npm/node

param(
  [string]$TargetRoot = "F:\Users\Xtik\var\var1"
)

$ErrorActionPreference = "Stop"
$Source = "F:\Users\Xtik\WEBPLUS.worktrees\agents-assistant-comparison-between-assistants"
$WebplusRoot = "F:\Users\Xtik\WEBPLUS"

if (-not (Test-Path $Source)) {
  throw "المصدر غير موجود: $Source"
}

Write-Host "إيقاف عمليات node على المنافذ 5174 و 3000..."
Get-NetTCPConnection -LocalPort 5174,3000 -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

New-Item -ItemType Directory -Force -Path $TargetRoot | Out-Null

Write-Host "نقل worktree عبر git..."
Set-Location $WebplusRoot
git worktree move $Source $TargetRoot

Write-Host "تم. المسار الجديد:"
Write-Host $TargetRoot
Write-Host ""
Write-Host "افتح هذا المجلد في Cursor:"
Write-Host "  $TargetRoot"
Write-Host ""
Write-Host "لدمج الفرع في main لاحقاً:"
Write-Host "  cd $WebplusRoot"
Write-Host "  git checkout main"
Write-Host "  git merge agents/assistant-comparison-between-assistants"
