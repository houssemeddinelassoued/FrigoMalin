$ErrorActionPreference = 'Stop'

try {
    $event = [Console]::In.ReadToEnd() | ConvertFrom-Json
    $toolName = ($event.tool_name -split '\.')[-1]
    $editTools = @('apply_patch', 'create_file', 'replace_string_in_file', 'multi_replace_string_in_file', 'insert_edit_into_file', 'edit_file')
    if ($toolName -notin $editTools) { exit 0 }

    $arguments = $event.tool_input
    if ($arguments -is [string]) { $arguments = $arguments | ConvertFrom-Json }
    $paths = @()
    foreach ($entry in @($arguments) + @($arguments.replacements) + @($arguments.edits)) {
        foreach ($property in @('filePath', 'file_path', 'path')) {
            if ($entry.$property -is [string]) { $paths += $entry.$property }
        }
    }
    if ($toolName -eq 'apply_patch') {
        $patch = [string]$arguments.input
        if (-not $patch) { $patch = [string]$arguments.patch }
        foreach ($line in ($patch -split '\r?\n')) {
            if ($line -match '^\*\*\* (?:Add|Update)(?: File)?: (.+?)(?: -> .*)?$' -or $line -match '^\*\*\* Move to: (.+)$') {
                $paths += $Matches[1]
            }
        }
    }

    $root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
    $prefix = $root.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    $files = @($paths | ForEach-Object {
        $candidate = $_
        if (-not [IO.Path]::IsPathRooted($candidate)) { $candidate = Join-Path $root $candidate }
        $candidate = [IO.Path]::GetFullPath($candidate)
        if ($candidate.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            $relative = $candidate.Substring($prefix.Length).Replace('\', '/')
            if ($relative -notmatch '(^|/)(node_modules|dist|coverage|playwright-report|test-results|\.git)(/|$)') {
                $candidate
            }
        }
    } | Sort-Object -Unique)
    if ($files.Count -eq 0) { exit 0 }

    $prettierFiles = @($files | Where-Object { [IO.Path]::GetExtension($_) -in @('.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.jsonc', '.css', '.scss', '.html', '.md', '.yaml', '.yml') })
    $eslintFiles = @($files | Where-Object { [IO.Path]::GetExtension($_) -in @('.js', '.ts', '.tsx') })
    if ($prettierFiles.Count -eq 0 -and $eslintFiles.Count -eq 0) { exit 0 }

    Push-Location $root
    try {
        $failed = $false
        $logs = @()
        if ($prettierFiles.Count -gt 0) {
            $logs += & node (Join-Path $root 'node_modules/prettier/bin/prettier.cjs') --write --ignore-unknown -- @prettierFiles 2>&1
            if ($LASTEXITCODE -ne 0) { $failed = $true }
        }
        if ($eslintFiles.Count -gt 0) {
            $logs += & node (Join-Path $root 'node_modules/eslint/bin/eslint.js') --fix --no-warn-ignored -- @eslintFiles 2>&1
            if ($LASTEXITCODE -ne 0) { $failed = $true }
        }
        if ($failed) {
            @{
                decision = 'block'
                reason = "Le formatage ou le lint a echoue. Corriger les erreurs restantes.`n$($logs -join "`n")"
            } | ConvertTo-Json -Compress
        }
    }
    finally { Pop-Location }
}
catch {
    @{
        decision = 'block'
        reason = "Impossible d'executer le hook de formatage et lint : $($_.Exception.Message)"
    } | ConvertTo-Json -Compress
}