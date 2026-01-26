@echo off
title Build YT & Bilibili Pro V9.8.0
cd /d "D:\TOOL\AutoImageFX\LAM_FILE_SETUP"

echo [1/2] Dang build file EXE...
:: Thêm BBDown.exe vào resource của file EXE
pyinstaller --noconsole --onefile --icon=icon.ico --name="YT_Pro_Server" --clean --add-data "ffmpeg.exe;." --add-data "BBDown.exe;." --hidden-import=pystray --hidden-import=PIL server.py

echo.
echo [2/2] Dang tao file Setup voi Inno Setup...
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" "setup_script.iss"

echo.
echo XONG!
pause