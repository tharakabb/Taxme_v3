@echo off
echo =========================================
echo Setting up the npm application...
echo =========================================
echo.

echo [1/3] Installing dependencies (npm install)...
call npm install
:: Check if the previous command failed
if %errorlevel% neq 0 (
    echo.
    echo Error: 'npm install' failed! Stopping setup.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Fixing vulnerabilities (npm audit fix)...
call npm audit fix
:: We don't exit on audit fix failure, as it often throws warnings but isn't fatal.
if %errorlevel% neq 0 (
    echo.
    echo Warning: 'npm audit fix' encountered issues, but continuing anyway...
)

echo.
echo [3/3] Seeding the database (npm run seed)...
call npm run seed
if %errorlevel% neq 0 (
    echo.
    echo Error: 'npm run seed' failed! Stopping setup.
    pause
    exit /b %errorlevel%
)

echo.
echo =========================================
echo Application setup completed successfully!
echo =========================================
pause
