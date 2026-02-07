@echo off
echo ============================================
echo Mogao Digital Twin - Code Generator
echo ============================================
echo.

echo Cleaning previous generated code...
if exist "src\main\java\digital\twin\mogao\dto" (
    rmdir /s /q "src\main\java\digital\twin\mogao\dto"
    echo   Removed dto directory
)
if exist "src\main\java\digital\twin\mogao\service" (
    rmdir /s /q "src\main\java\digital\twin\mogao\service"
    echo   Removed service directory
)
if exist "src\main\java\digital\twin\mogao\controller" (
    rmdir /s /q "src\main\java\digital\twin\mogao\controller"
    echo   Removed controller directory
)
REM Backup manual components before cleanup
if exist "..\frontend\components\ModelViewer.js" (
    copy /y "..\frontend\components\ModelViewer.js" "..\frontend\ModelViewer.js.backup" >nul
    echo   Backed up ModelViewer.js
)
if exist "..\frontend\components\SimulationPanel.js" (
    copy /y "..\frontend\components\SimulationPanel.js" "..\frontend\SimulationPanel.js.backup" >nul
    echo   Backed up SimulationPanel.js
)
if exist "..\frontend\components" (
    rmdir /s /q "..\frontend\components"
    echo   Removed frontend components directory
)
REM Restore manual components after cleanup
mkdir "..\frontend\components" 2>nul
if exist "..\frontend\ModelViewer.js.backup" (
    copy /y "..\frontend\ModelViewer.js.backup" "..\frontend\components\ModelViewer.js" >nul
    del "..\frontend\ModelViewer.js.backup"
    echo   Restored ModelViewer.js
)
if exist "..\frontend\SimulationPanel.js.backup" (
    copy /y "..\frontend\SimulationPanel.js.backup" "..\frontend\components\SimulationPanel.js" >nul
    del "..\frontend\SimulationPanel.js.backup"
    echo   Restored SimulationPanel.js
)
if exist "..\frontend\composables" (
    rmdir /s /q "..\frontend\composables"
    echo   Removed frontend composables directory
)
if exist "..\frontend\app.js" (
    copy /y "..\frontend\app.js" "..\frontend\app.js.backup" >nul
    echo   Backed up app.js to app.js.backup
)

echo.
echo Compiling project (initial)...
call mvn compile -q

if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Running code generator...
call mvn exec:java@codegen

if %ERRORLEVEL% NEQ 0 (
    echo Code generation failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo Code generation complete!
echo.
echo Generated Backend Code:
echo   - DTOs:        src\main\java\digital\twin\mogao\dto
echo   - Services:    src\main\java\digital\twin\mogao\service
echo   - Controllers: src\main\java\digital\twin\mogao\controller
echo.
echo Generated Frontend Code:
echo   - Components:  ..\frontend\components
echo   - Composables: ..\frontend\composables
echo   - App.js:      ..\frontend\app.js
echo.
echo Note: Previous app.js backed up to app.js.backup
echo ============================================
pause
