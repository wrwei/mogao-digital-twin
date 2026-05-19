@echo off
REM ============================================
REM Mogao Digital Twin - Clean and Regenerate (Phase 1 stub)
REM ============================================
REM
REM Disabled in Phase 1. The previous version of this script wiped
REM directories that are now load-bearing (most importantly the live
REM backend at backend\generated\mongoose\, plus the hand-extended
REM Vue 3 frontend). Running it as-is would have destroyed work.
REM
REM Phase 2 will restore a safe regenerate-with-fences flow.
REM
REM Until then, see generate-code.bat (the codegen entry point is a
REM no-op) and backend\src\main\resources\transformation\
REM RUN_TRANSFORMATIONS.md.

echo This command is disabled. See backend\generate-code.bat.
exit /b 1
