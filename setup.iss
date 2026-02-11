[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName=Accord
AppVersion=1.0.3
AppPublisher=Accord Team
DefaultDirName={autopf}\Accord
DefaultGroupName=Accord
UninstallDisplayIcon={app}\Accord.exe
OutputDir=dist-setup
OutputBaseFilename=Accord-Setup
SetupIconFile=resources\icon.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
CloseApplications=force
RestartApplications=yes

[Files]
Source: "dist-build\Accord-win32-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Accord"; Filename: "{app}\Accord.exe"; IconFilename: "{app}\Accord.exe"
Name: "{autodesktop}\Accord"; Filename: "{app}\Accord.exe"; IconFilename: "{app}\Accord.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Masaüstüne kısayol oluştur enayi mert"; GroupDescription: "Ek simgeler:"

[Run]
Filename: "{app}\Accord.exe"; Description: "Accord'u başlat"; Flags: nowait postinstall skipifsilent
