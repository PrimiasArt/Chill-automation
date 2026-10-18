Add-Type -AssemblyName System.Drawing

$rootDir = Split-Path -Parent $PSScriptRoot
$icoPath = Join-Path $rootDir "public\chill-argon-studio.ico"
$csPath = Join-Path $rootDir "scripts\Launcher.cs"
$exePath = Join-Path $rootDir "Chill Argon Studio.exe"

function New-IconBitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $pad = [float]($size * 0.06)
    $rectSize = [float]($size - $pad * 2)
    $radius = [float]($size * 0.24)

    # Rounded squircle path
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($pad, $pad, $d, $d, 180, 90)
    $path.AddArc($pad + $rectSize - $d, $pad, $d, $d, 270, 90)
    $path.AddArc($pad + $rectSize - $d, $pad + $rectSize - $d, $d, $d, 0, 90)
    $path.AddArc($pad, $pad + $rectSize - $d, $d, $d, 90, 90)
    $path.CloseFigure()

    # Dark cyber background gradient
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF(0, 0)),
        (New-Object System.Drawing.PointF($size, $size)),
        [System.Drawing.Color]::FromArgb(255, 14, 20, 36),
        [System.Drawing.Color]::FromArgb(255, 7, 10, 18)
    )
    $g.FillPath($bgBrush, $path)

    # Neon gradient border
    $borderWidth = [Math]::Max(1.5, $size * 0.055)
    $borderBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF(0, 0)),
        (New-Object System.Drawing.PointF($size, $size)),
        [System.Drawing.Color]::FromArgb(255, 212, 255, 71),
        [System.Drawing.Color]::FromArgb(255, 0, 240, 255)
    )
    $borderPen = New-Object System.Drawing.Pen($borderBrush, $borderWidth)
    $g.DrawPath($borderPen, $path)

    # Inner glowing ring
    $ringPad = [float]($size * 0.20)
    $ringSize = [float]($size - $ringPad * 2)
    $ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 0, 240, 255), [Math]::Max(1.0, $size * 0.025))
    $g.DrawEllipse($ringPen, $ringPad, $ringPad, $ringSize, $ringSize)

    # Play Triangle in Neon Lime -> Cyan gradient
    $p1 = New-Object System.Drawing.PointF(($size * 0.37), ($size * 0.28))
    $p2 = New-Object System.Drawing.PointF(($size * 0.37), ($size * 0.72))
    $p3 = New-Object System.Drawing.PointF(($size * 0.73), ($size * 0.50))
    $playPts = [System.Drawing.PointF[]]@($p1, $p2, $p3)

    $playBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF(($size * 0.35), ($size * 0.28))),
        (New-Object System.Drawing.PointF(($size * 0.75), ($size * 0.72))),
        [System.Drawing.Color]::FromArgb(255, 212, 255, 71),
        [System.Drawing.Color]::FromArgb(255, 0, 240, 255)
    )
    $g.FillPolygon($playBrush, $playPts)

    # Top-right AI spark dot
    $dotR = [float]($size * 0.09)
    $dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 0, 85))
    $g.FillEllipse($dotBrush, ($size * 0.68), ($size * 0.20), $dotR, $dotR)

    $g.Dispose()
    return $bmp
}

$sizes = @(256, 64, 32, 16)
$pngBuffers = New-Object System.Collections.Generic.List[byte[]]

foreach ($s in $sizes) {
    $bmp = New-IconBitmap $s
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBuffers.Add($ms.ToArray())
    $ms.Dispose()
    $bmp.Dispose()
}

# Write multi-resolution .ICO file
$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter($fs)

# ICONDIR header
$bw.Write([uint16]0) # Reserved
$bw.Write([uint16]1) # Type 1 = ICO
$bw.Write([uint16]$sizes.Count)

$offset = 6 + (16 * $sizes.Count)

for ($i = 0; $i -lt $sizes.Count; $i++) {
    $s = $sizes[$i]
    $buf = $pngBuffers[$i]
    $dimByte = if ($s -ge 256) { [byte]0 } else { [byte]$s }

    $bw.Write($dimByte)          # Width
    $bw.Write($dimByte)          # Height
    $bw.Write([byte]0)           # ColorCount
    $bw.Write([byte]0)           # Reserved
    $bw.Write([uint16]1)         # Planes
    $bw.Write([uint16]32)        # BitCount
    $bw.Write([uint32]$buf.Length)
    $bw.Write([uint32]$offset)

    $offset += $buf.Length
}

for ($i = 0; $i -lt $sizes.Count; $i++) {
    $bw.Write($pngBuffers[$i])
}

$bw.Flush()
$bw.Close()
$fs.Close()

Write-Host "Generated multi-resolution icon at: $icoPath"

# Compile ChillStudio.exe using built-in .NET C# compiler
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
& $csc /nologo /codepage:65001 /target:winexe /optimize+ "/win32icon:$icoPath" "/out:$exePath" /r:System.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll "$csPath"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully compiled native app: $exePath"
} else {
    Write-Error "Compilation failed with code $LASTEXITCODE"
    exit $LASTEXITCODE
}
