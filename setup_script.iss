[Setup]
AppName=YT Pro & Bilibili Downloader
AppVersion=9.8.0
AppPublisher=Van Khai AI
DefaultDirName={autopf}\YT Pro Downloader
DefaultGroupName=YT Pro Downloader
OutputBaseFilename=CaiDat_YT_Bili_V9.8.0
SetupIconFile=D:\TOOL\AutoImageFX\LAM_FILE_SETUP\icon.ico
Compression=lzma
SolidCompression=yes

[Files]
; File EXE chính (đã tích hợp logic)
Source: "D:\TOOL\AutoImageFX\LAM_FILE_SETUP\dist\YT_Pro_Server.exe"; DestDir: "{app}"; Flags: ignoreversion

; Copy thêm ffmpeg và BBDown ra ngoài cho chắc chắn (dự phòng)
Source: "D:\TOOL\AutoImageFX\LAM_FILE_SETUP\ffmpeg.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "D:\TOOL\AutoImageFX\LAM_FILE_SETUP\BBDown.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "D:\TOOL\AutoImageFX\LAM_FILE_SETUP\icon.ico"; DestDir: "{app}"; Flags: ignoreversion

; Copy toàn bộ Extension source
Source: "D:\TOOL\AutoImageFX\LAM_FILE_SETUP\yt-downloader-extension\*"; DestDir: "{app}\Extension_Source"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{commondesktop}\YT Pro Server"; Filename: "{app}\YT_Pro_Server.exe"
Name: "{userstartup}\YT Pro Server"; Filename: "{app}\YT_Pro_Server.exe"

[Run]
Filename: "{app}\YT_Pro_Server.exe"; Description: "Chạy Server ngay"; Flags: nowait postinstall