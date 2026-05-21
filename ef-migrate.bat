@echo off
setlocal enabledelayedexpansion
echo === Entity Framework Migration Scripts ===
echo 1. Add Initial Migration
echo 2. Update Database
echo 3. Remove Last Migration
echo 4. Script Migration (SQL)
echo =========================================
set /p choice="Select an option (1-4): "

if "!choice!"=="1" (
    set /p name="Enter migration name: "
    dotnet ef migrations add !name! --project JiraClone.Data --startup-project AspNetReactApp
)
if "!choice!"=="2" (
    dotnet ef database update --project JiraClone.Data --startup-project AspNetReactApp
)
if "!choice!"=="3" (
    dotnet ef migrations remove --project JiraClone.Data --startup-project AspNetReactApp
)
if "!choice!"=="4" (
    dotnet ef migrations script --project JiraClone.Data --startup-project AspNetReactApp
)

pause
