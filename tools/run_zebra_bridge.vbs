Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
scriptDir = files.GetParentFolderName(WScript.ScriptFullName)
shell.Run Chr(34) & scriptDir & "\start_zebra_bridge.bat" & Chr(34), 0, False
