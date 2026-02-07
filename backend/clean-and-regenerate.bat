@echo off
echo ============================================
echo Mogao Digital Twin - Clean and Regenerate
echo ============================================
echo.

REM Kill any processes using port 8080
echo Checking for processes on port 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    echo Killing process %%a on port 8080...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Cleaning generated code...

REM Remove generated backend code
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

REM Remove generated frontend code
if exist "..\frontend\components" (
    rmdir /s /q "..\frontend\components"
    echo   Removed frontend components directory
)
if exist "..\frontend\composables" (
    rmdir /s /q "..\frontend\composables"
    echo   Removed frontend composables directory
)
if exist "..\frontend\app.js" (
    del /q "..\frontend\app.js"
    echo   Removed app.js
)
if exist "..\frontend\i18n.js" (
    del /q "..\frontend\i18n.js"
    echo   Removed i18n.js
)
if exist "..\frontend\index.html" (
    del /q "..\frontend\index.html"
    echo   Removed index.html
)

REM Clean Maven target (optional - uncomment if needed)
REM if exist "target" (
REM     rmdir /s /q "target"
REM     echo   Removed target directory
REM )

echo.
echo Compiling project...
call mvn compile

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================
    echo ERROR: Compilation failed!
    echo ============================================
    pause
    exit /b 1
)

echo.
echo Running code generator...
call mvn exec:java@codegen

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================
    echo ERROR: Code generation failed!
    echo ============================================
    pause
    exit /b 1
)

REM Restore manual components after code generation
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

echo.
echo ============================================
echo Clean and Regenerate Complete!
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
echo   - i18n.js:     ..\frontend\i18n.js
echo   - index.html:  ..\frontend\index.html
echo.
echo Generated EOL Scripts:
echo   - Scripts:     src\main\resources\eol-scripts
echo ============================================
echo.
echo You can now run: mvn mn:run
echo.
pause
