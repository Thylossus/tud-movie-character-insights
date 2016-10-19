@if "%SCM_TRACE_LEVEL%" NEQ "4" @echo off

:: ----------------------
:: KUDU Deployment Script
:: Version: 1.0.6
:: ----------------------

:: Prerequisites
:: -------------

:: Verify node.js installed
where node 2>nul >nul
IF %ERRORLEVEL% NEQ 0 (
  echo Missing node.js executable, please install node.js, if already installed make sure it can be reached from current environment.
  goto error
)

:: Setup
:: -----

setlocal enabledelayedexpansion

SET ARTIFACTS=%~dp0%..\artifacts

IF NOT DEFINED DEPLOYMENT_SOURCE (
  SET DEPLOYMENT_SOURCE=%~dp0%.
)

IF "%DEPLOYMENT_ENV%" == "Server" (
  echo Change deployment source for server deployment
  SET DEPLOYMENT_ROOT=%~dp0%Server
  SET DEPLOYMENT_SOURCE=%~dp0%Server\app
  echo Root: !DEPLOYMENT_ROOT!
  echo Source: !DEPLOYMENT_SOURCE!
  REM endlocal
  REM setlocal enabledelayedexpansion
)


IF NOT DEFINED DEPLOYMENT_TARGET (
  SET DEPLOYMENT_TARGET=%ARTIFACTS%\wwwroot
)

IF NOT DEFINED NEXT_MANIFEST_PATH (
  SET NEXT_MANIFEST_PATH=%ARTIFACTS%\manifest

  IF NOT DEFINED PREVIOUS_MANIFEST_PATH (
    SET PREVIOUS_MANIFEST_PATH=%ARTIFACTS%\manifest
  )
)

IF NOT DEFINED KUDU_SYNC_CMD (
  :: Install kudu sync
  echo Installing Kudu Sync
  call npm install kudusync -g --silent
  IF !ERRORLEVEL! NEQ 0 goto error

  :: Locally just running "kuduSync" would also work
  SET KUDU_SYNC_CMD=%appdata%\npm\kuduSync.cmd
)
goto Deployment

:: Utility Functions
:: -----------------

:SelectNodeVersion

IF DEFINED KUDU_SELECT_NODE_VERSION_CMD (
  :: The following are done only on Windows Azure Websites environment
  call %KUDU_SELECT_NODE_VERSION_CMD% "%DEPLOYMENT_SOURCE%" "%DEPLOYMENT_TARGET%" "%DEPLOYMENT_TEMP%"
  IF !ERRORLEVEL! NEQ 0 goto error

  IF EXIST "%DEPLOYMENT_TEMP%\__nodeVersion.tmp" (
    SET /p NODE_EXE=<"%DEPLOYMENT_TEMP%\__nodeVersion.tmp"
    IF !ERRORLEVEL! NEQ 0 goto error
  )
  
  IF EXIST "%DEPLOYMENT_TEMP%\__npmVersion.tmp" (
    SET /p NPM_JS_PATH=<"%DEPLOYMENT_TEMP%\__npmVersion.tmp"
    IF !ERRORLEVEL! NEQ 0 goto error
  )

  IF NOT DEFINED NODE_EXE (
    SET NODE_EXE=node
  )

  SET NPM_CMD="!NODE_EXE!" "!NPM_JS_PATH!"
) ELSE (
  SET NPM_CMD=npm
  SET NODE_EXE=node
)

goto :EOF

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Deployment
:: ----------

:Deployment
call :SelectNodeVersion

echo Detect deployment environment (%DEPLOYMENT_ENV%)

IF "%DEPLOYMENT_ENV%" == "Client" (
  echo Running build script for the client.

  IF EXIST "%DEPLOYMENT_SOURCE%\Client\package.json" (
    pushd "%DEPLOYMENT_SOURCE%\Client"
    echo npm install
    call :ExecuteCmd !NPM_CMD! install
    IF !ERRORLEVEL! NEQ 0 goto error
    
    echo npm run prebuild
    call :ExecuteCmd !NPM_CMD! run prebuild
    IF !ERRORLEVEL! NEQ 0 goto error
    
    echo npm run build
    call :ExecuteCmd !NPM_CMD! run build
    IF !ERRORLEVEL! NEQ 0 goto error
    
    popd
    
    echo copy files
    call :ExecuteCmd "%KUDU_SYNC_CMD%" -v 50 -f "%DEPLOYMENT_SOURCE%\Client\build" -t "%DEPLOYMENT_TARGET%" -n "%NEXT_MANIFEST_PATH%" -p "%PREVIOUS_MANIFEST_PATH%" -i ".git;.hg;.deployment;deploy.cmd"
    IF !ERRORLEVEL! NEQ 0 goto error
  )
)

IF "%DEPLOYMENT_ENV%" == "Server" (
	echo Running build script for the server.
	echo !DEPLOYMENT_SOURCE!

	IF EXIST !DEPLOYMENT_SOURCE!\package.json (
    pushd !DEPLOYMENT_SOURCE!
    echo npm install --production
    call :ExecuteCmd !NPM_CMD! install --production
    IF !ERRORLEVEL! NEQ 0 goto error
    popd
	
	xcopy /Y !DEPLOYMENT_ROOT!\server.conf !DEPLOYMENT_SOURCE!
	IF !ERRORLEVEL! NEQ 0 goto error
	
    echo copy files
    call :ExecuteCmd "%KUDU_SYNC_CMD%" -v 50 -f !DEPLOYMENT_SOURCE! -t "%DEPLOYMENT_TARGET%" -n "%NEXT_MANIFEST_PATH%" -p "%PREVIOUS_MANIFEST_PATH%" -i ".git;.hg;.deployment;deploy.cmd"
    IF !ERRORLEVEL! NEQ 0 goto error
    
    REM echo copy config files
    REM call :ExecuteCmd "%KUDU_SYNC_CMD%" -v 50 -f !DEPLOYMENT_ROOT! -t "%DEPLOYMENT_TARGET%" -n "%NEXT_MANIFEST_PATH%" -p "%PREVIOUS_MANIFEST_PATH%" -i "app;include;Tools"
    REM IF !ERRORLEVEL! NEQ 0 goto error
    
    call :SelectNodeVersion
	)
	
)


::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:: Post deployment stub
IF DEFINED POST_DEPLOYMENT_ACTION call "%POST_DEPLOYMENT_ACTION%"
IF !ERRORLEVEL! NEQ 0 goto error

goto end

:: Execute command routine that will echo out when error
:ExecuteCmd
setlocal
set _CMD_=%*
call %_CMD_%
if "%ERRORLEVEL%" NEQ "0" echo Failed exitCode=%ERRORLEVEL%, command=%_CMD_%
exit /b %ERRORLEVEL%

:error
endlocal
echo An error has occurred during web site deployment.
call :exitSetErrorLevel
call :exitFromFunction 2>nul

:exitSetErrorLevel
exit /b 1

:exitFromFunction
()

:end
endlocal
echo Finished successfully.
