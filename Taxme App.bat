@echo off
echo Starting the development environment...

:: 1. Open the browser (change the port number if your app uses something other than 3000)
echo Opening browser to http://localhost:3000...
start http://localhost:3000

:: 2. Run the npm command
echo Running npm run dev...
call npm run dev

:: Optional: keep the window open if the process crashes
cmd /k
