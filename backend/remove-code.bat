@echo off
echo ============================================
echo Mogao Digital Twin - Code Remover
echo ============================================
echo.

echo Removing generated code...

if exist "src\main\java\digital\twin\mogao\dto" (
    rmdir /s /q "src\main\java\digital\twin\mogao\dto"
    echo   Removed dto directory
) else (
    echo   No dto directory found
)

if exist "src\main\java\digital\twin\mogao\service" (
    rmdir /s /q "src\main\java\digital\twin\mogao\service"
    echo   Removed service directory
) else (
    echo   No service directory found
)

if exist "src\main\java\digital\twin\mogao\controller" (
    rmdir /s /q "src\main\java\digital\twin\mogao\controller"
    echo   Removed controller directory
) else (
    echo   No controller directory found
)

if exist "..\frontend\components" (
    rmdir /s /q "..\frontend\components"
    echo   Removed frontend components directory
) else (
    echo   No frontend components directory found
)

if exist "..\frontend\composables" (
    rmdir /s /q "..\frontend\composables"
    echo   Removed frontend composables directory
) else (
    echo   No frontend composables directory found
)

echo.
echo ============================================
echo Generated code removed successfully!
echo ============================================
pause
