@echo off
REM ============================================
REM Mogao Digital Twin - Code Generator (Phase 1 stub)
REM ============================================
REM
REM The Java/Micronaut runtime backend has been retired. The runtime
REM backend is now Node.js + Express + Mongoose at backend\generated\
REM mongoose\ and is not built by Maven.
REM
REM The Mongoose regeneration pipeline is being redesigned (Phase 2)
REM to preserve hand-extended business logic via fenced extension
REM regions; auto-generation is therefore disabled until that lands.
REM
REM Running the codegen entry point today prints a no-op informational
REM message — see backend\src\main\java\digital\twin\mogao\codegen\
REM CodeGenerator.java.
REM
REM For ad-hoc EGL invocations against the metamodel, see
REM backend\src\main\resources\transformation\RUN_TRANSFORMATIONS.md.

echo ============================================
echo Mogao Digital Twin - Code Generator
echo ============================================
echo.

call mvn exec:java@codegen
if %ERRORLEVEL% NEQ 0 (
    echo Code generator entry point failed.
    pause
    exit /b 1
)

echo.
echo Done.
echo.
pause
