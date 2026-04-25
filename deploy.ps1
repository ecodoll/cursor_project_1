# 가계부 배포 전: index.html을 couple_household_book.html과 맞춥니다.
# Vercel은 저장소 연동 시 npm run build로 같은 작업을 합니다.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (Get-Command node -ErrorAction SilentlyContinue) {
  npm run build
  Write-Host "OK: npm run build 완료 (index.html 갱신)."
} else {
  Copy-Item -Force "couple_household_book.html" "index.html"
  Write-Host "OK: index.html 복사 완료. (Node 설치 후에는 npm run build 를 쓸 수 있습니다.)"
}
