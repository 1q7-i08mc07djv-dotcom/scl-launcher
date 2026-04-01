$root = "c:/Users/Doudou/WorkBuddy/20260401175534"
$files = Get-ChildItem -Path $root -Recurse -Include "*.java","*.xml","*.bat","*.fxml","*.css","*.md","*.gradle","*.properties","*.rc","*.cpp" -File
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8
    if ($content -match "SkyLauncher|skylauncher") {
        $new = $content -replace "SkyLauncher", "SCL" -replace "skylauncher", "scl"
        Set-Content -Path $f.FullName -Value $new -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($f.Name)"
    }
}
Write-Host "Done!"
