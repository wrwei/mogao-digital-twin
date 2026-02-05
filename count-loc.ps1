# Line of Code Counter for Mogao Digital Twin Project
# PowerShell Version

Write-Host "=============================================="
Write-Host "  Lines of Code Counter"
Write-Host "  Mogao Digital Twin Project"
Write-Host "=============================================="
Write-Host ""
Write-Host "Lines of Code by File Type:"
Write-Host "----------------------------------------------"

# Function to count lines in files
function Count-Lines {
    param (
        [string]$Pattern,
        [string]$Description
    )

    $files = Get-ChildItem -Path . -Recurse -Filter $Pattern -File |
        Where-Object {
            $_.FullName -notmatch '\\node_modules\\' -and
            $_.FullName -notmatch '\\target\\' -and
            $_.FullName -notmatch '\\build\\' -and
            $_.FullName -notmatch '\\.git\\' -and
            $_.FullName -notmatch '\\.claude\\' -and
            $_.FullName -notmatch '\\dist\\' -and
            $_.FullName -notmatch '\\out\\'
        }

    $totalLines = 0
    $fileCount = 0

    foreach ($file in $files) {
        $lines = (Get-Content $file.FullName -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
        $totalLines += $lines
        $fileCount++
    }

    Write-Host ("{0,-20} {1,10}" -f "${Description}:", $totalLines)

    return @{
        Lines = $totalLines
        Count = $fileCount
    }
}

# Count by file type
$java = Count-Lines -Pattern "*.java" -Description "Java"
$js = Count-Lines -Pattern "*.js" -Description "JavaScript"
$html = Count-Lines -Pattern "*.html" -Description "HTML"
$css = Count-Lines -Pattern "*.css" -Description "CSS"
$xml = Count-Lines -Pattern "*.xml" -Description "XML"
$json = Count-Lines -Pattern "*.json" -Description "JSON"
$md = Count-Lines -Pattern "*.md" -Description "Markdown"
$flexmi = Count-Lines -Pattern "*.flexmi" -Description "Flexmi Models"
$properties = Count-Lines -Pattern "*.properties" -Description "Properties"

Write-Host ""
Write-Host "=============================================="

# Calculate total
$total = $java.Lines + $js.Lines + $html.Lines + $css.Lines + $xml.Lines + $json.Lines + $md.Lines + $flexmi.Lines + $properties.Lines
Write-Host ("{0,-20} {1,10}" -f "TOTAL LINES:", $total)

Write-Host "=============================================="
Write-Host ""

# Show file counts
Write-Host "File Counts:"
Write-Host "----------------------------------------------"
Write-Host ("{0,-20} {1,10}" -f "Java files:", $java.Count)
Write-Host ("{0,-20} {1,10}" -f "JavaScript files:", $js.Count)
Write-Host ("{0,-20} {1,10}" -f "HTML files:", $html.Count)
Write-Host ("{0,-20} {1,10}" -f "CSS files:", $css.Count)
Write-Host ""
