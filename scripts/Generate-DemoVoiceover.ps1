[CmdletBinding()]
param(
    [string]$InputPath,
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
if (-not $InputPath) {
    $InputPath = Join-Path $PSScriptRoot '..\docs\00-Hackathon\video\narration-en.txt'
}
if (-not $OutputPath) {
    $OutputPath = Join-Path $PSScriptRoot '..\docs\00-Hackathon\video\voiceover-en.wav'
}
Add-Type -AssemblyName System.Speech

$outputDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

$synthesizer = [System.Speech.Synthesis.SpeechSynthesizer]::new()
try {
    $englishVoice = $synthesizer.GetInstalledVoices() |
        Where-Object { $_.VoiceInfo.Culture.Name -like 'en-*' } |
        Select-Object -First 1
    if ($englishVoice) {
        $synthesizer.SelectVoice($englishVoice.VoiceInfo.Name)
    }
    $synthesizer.Rate = -1
    $synthesizer.Volume = 100
    $synthesizer.SetOutputToWaveFile($OutputPath)
    $synthesizer.Speak((Get-Content -Raw -Encoding UTF8 $InputPath))
} finally {
    $synthesizer.Dispose()
}

$file = Get-Item $OutputPath
if ($file.Length -lt 100000) {
    throw "Generated voiceover is unexpectedly small: $($file.Length) bytes"
}
Write-Output "Demo voiceover: PASS ($OutputPath, $($file.Length) bytes)"