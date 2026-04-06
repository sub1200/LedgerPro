@echo off
echo ========================================
echo   Building LedgerPro EXE
echo ========================================

echo [1/3] Installing dependencies...
npm install

echo [2/3] Building EXE...
npx electron-builder --win portable

echo [3/3] Done!
echo Your EXE is in dist folder
pause