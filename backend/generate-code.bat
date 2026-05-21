@echo off
REM ============================================
REM Mogao Digital Twin - Code Generator
REM ============================================
REM
REM Regenerates the Mongoose data layer from the Ecore metamodel:
REM   - one Mongoose model per EClass (concrete + abstract)
REM   - models/index.js
REM   - one Service / Controller / Router per concrete entity in the
REM     CodeGenerator entityClasses array
REM
REM Does NOT touch app.js, server.js, package.json, the four
REM services/controllers/routers index.js files, or any of the
REM hand-written services (auth, telemetry, anomaly, maintenance,
REM deterioration, replay, exhibit, validation). Those are
REM hand-written infrastructure outside the metamodel's remit.
REM
REM See backend/src/main/java/digital/twin/mogao/codegen/CodeGenerator.java
REM for the entity list and Javadoc.

echo ============================================
echo Mogao Digital Twin - Code Generator
echo ============================================
echo.

call mvn -q compile
if %ERRORLEVEL% NEQ 0 (
    echo Compilation failed.
    pause
    exit /b 1
)

call mvn -q exec:java@codegen
if %ERRORLEVEL% NEQ 0 (
    echo Code generator failed.
    pause
    exit /b 1
)

echo.
echo Done. Run `git status backend/runtime/` to inspect changes.
echo.
pause
