:: Created by npm, please don't edit manually.
@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe" "%~dp0\ssc2nd.js" %*
) ELSE (
  node "%~dp0\ssc2nd.js" %*
)
@PAUSE