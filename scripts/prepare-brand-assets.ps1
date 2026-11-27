# Generates PWA icons, splash screen and in-app branding from the two source
# images in the project root. Run from the project root:
#   powershell -ExecutionPolicy Bypass -File scripts/prepare-brand-assets.ps1
#
# The source images are intentionally NOT committed. Only the generated
# public/ assets are.

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$publicDir = Join-Path $root 'public'
$emblem = Join-Path $root 'Makenna Lab Learning Emblem-1.png'
$badge = Join-Path $root 'Makenna Lab Learning Badge-2.png'

if (-not (Test-Path -LiteralPath $emblem)) { throw "Missing source image: $emblem" }
if (-not (Test-Path -LiteralPath $badge)) { throw "Missing source image: $badge" }

function Get-OpaqueBounds {
    param([System.Drawing.Image]$Image, [int]$Step = 4)

    $left = $Image.Width; $top = $Image.Height; $right = 0; $bottom = 0
    $bitmap = New-Object System.Drawing.Bitmap($Image)
    try {
        for ($y = 0; $y -lt $Image.Height; $y += $Step) {
            for ($x = 0; $x -lt $Image.Width; $x += $Step) {
                if ($bitmap.GetPixel($x, $y).A -gt 12) {
                    if ($x -lt $left) { $left = $x }
                    if ($x -gt $right) { $right = $x }
                    if ($y -lt $top) { $top = $y }
                    if ($y -gt $bottom) { $bottom = $y }
                }
            }
        }
    } finally { $bitmap.Dispose() }

    if ($right -le $left -or $bottom -le $top) {
        return @{ X = 0; Y = 0; Width = $Image.Width; Height = $Image.Height }
    }
    return @{ X = $left; Y = $top; Width = ($right - $left + 1); Height = ($bottom - $top + 1) }
}

function New-SquareImage {
    param([string]$Path, [int]$Size, [int]$PaddingPercent = 0)

    $source = [System.Drawing.Image]::FromFile($Path)
    try {
        $bounds = Get-OpaqueBounds -Image $source
        $side = [Math]::Min($bounds.Width, $bounds.Height)
        $x = [int]($bounds.X + ($bounds.Width - $side) / 2)
        $y = [int]($bounds.Y + ($bounds.Height - $side) / 2)
        $x = [Math]::Max(0, [Math]::Min($x, $source.Width - $side))
        $y = [Math]::Max(0, [Math]::Min($y, $source.Height - $side))

        $square = New-Object System.Drawing.Bitmap($side, $side)
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($square)
            try {
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $graphics.DrawImage($source, (New-Object System.Drawing.Rectangle(0, 0, $side, $side)),
                    (New-Object System.Drawing.Rectangle($x, $y, $side, $side)),
                    [System.Drawing.GraphicsUnit]::Pixel)
            } finally { $graphics.Dispose() }

            $pad = [int]($Size * $PaddingPercent / 100)
            $output = New-Object System.Drawing.Bitmap($Size, $Size)
            try {
                $g2 = [System.Drawing.Graphics]::FromImage($output)
                try {
                    $g2.Clear([System.Drawing.Color]::White)
                    $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                    $g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                    $g2.DrawImage($square, $pad, $pad, $Size - 2 * $pad, $Size - 2 * $pad)
                } finally { $g2.Dispose() }
                return $output
            } catch { $output.Dispose(); throw }
        } finally { $square.Dispose() }
    } finally { $source.Dispose() }
}

function Save-Png {
    param([System.Drawing.Image]$Image, [string]$Name)
    $target = Join-Path $publicDir $Name
    $Image.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "wrote $Name ($($Image.Width)x$($Image.Height))"
}

function New-SplashImage {
    param([System.Drawing.Image]$Source, [int]$Width, [int]$Height)

    $output = New-Object System.Drawing.Bitmap($Width, $Height)
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($output)
        try {
            $graphics.Clear([System.Drawing.Color]::White)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

            $scale = [Math]::Min($Width / $Source.Width, $Height / $Source.Height)
            $drawWidth = [int]($Source.Width * $scale)
            $drawHeight = [int]($Source.Height * $scale)
            $x = [int](($Width - $drawWidth) / 2)
            $y = [int](($Height - $drawHeight) / 2)
            $graphics.DrawImage($Source, $x, $y, $drawWidth, $drawHeight)
        } finally { $graphics.Dispose() }
        return $output
    } catch { $output.Dispose(); throw }
}

# Square app icons from the emblem.
@(72, 96, 128, 144, 152, 192, 384, 512) | ForEach-Object {
    $img = New-SquareImage -Path $emblem -Size $_
    try { Save-Png -Image $img -Name "icon-$($_)x$($_).png" } finally { $img.Dispose() }
}

# Apple touch icon and maskable icon (extra safe-zone padding).
$apple = New-SquareImage -Path $emblem -Size 180
try { Save-Png -Image $apple -Name 'apple-touch-icon.png' } finally { $apple.Dispose() }
$maskable = New-SquareImage -Path $emblem -Size 512 -PaddingPercent 18
try { Save-Png -Image $maskable -Name 'maskable-icon.png' } finally { $maskable.Dispose() }

# Small favicon PNGs plus a real Windows ICO (PNG-compressed entry).
@(16, 32) | ForEach-Object {
    $img = New-SquareImage -Path $emblem -Size $_
    try { Save-Png -Image $img -Name "favicon-$($_)x$($_).png" } finally { $img.Dispose() }
}

$icoImage = New-SquareImage -Path $emblem -Size 32
try {
    $stream = New-Object System.IO.MemoryStream
    try {
        $icoImage.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
        $png = $stream.ToArray()
        $header = New-Object byte[] 22
        [BitConverter]::GetBytes([uint16]0).CopyTo($header, 0)   # reserved
        [BitConverter]::GetBytes([uint16]1).CopyTo($header, 2)   # type: icon
        [BitConverter]::GetBytes([uint16]1).CopyTo($header, 4)   # count
        $header[6] = 32                                          # width
        $header[7] = 32                                          # height
        $header[8] = 0                                           # palette size
        $header[9] = 0                                           # reserved
        [BitConverter]::GetBytes([uint16]1).CopyTo($header, 10)  # planes
        [BitConverter]::GetBytes([uint16]32).CopyTo($header, 12) # bit count
        [BitConverter]::GetBytes([uint32]$png.Length).CopyTo($header, 14)
        [BitConverter]::GetBytes([uint32]22).CopyTo($header, 18)
        [System.IO.File]::WriteAllBytes((Join-Path $publicDir 'favicon.ico'), ($header + $png))
        Write-Output "wrote favicon.ico ($($png.Length) bytes payload)"
    } finally { $stream.Dispose() }
} finally { $icoImage.Dispose() }

# Splash screens and in-app brand images from the badge artwork.
$sourceBadge = [System.Drawing.Image]::FromFile($badge)
try {
    $splash = New-SplashImage -Source $sourceBadge -Width 1536 -Height 1024
    try { Save-Png -Image $splash -Name 'splash-screen.png' } finally { $splash.Dispose() }

    # Regenerate every device-specific startup image referenced by index.html.
    $html = Get-Content -Raw -LiteralPath (Join-Path $root 'index.html')
    foreach ($link in [regex]::Matches($html, '<link\s+rel="apple-touch-startup-image"[^>]*>')) {
        $tag = $link.Value
        $media = [regex]::Match($tag, 'media="([^"]+)"').Groups[1].Value
        $name = [regex]::Match($tag, 'href="/([^"]+\.png)"').Groups[1].Value
        if (-not $media -or -not $name) { continue }

        $deviceWidth = [regex]::Match($media, 'device-width:\s*(\d+)px').Groups[1].Value
        $deviceHeight = [regex]::Match($media, 'device-height:\s*(\d+)px').Groups[1].Value
        $ratioText = [regex]::Match($media, 'device-pixel-ratio:\s*(\d+)').Groups[1].Value
        if (-not $deviceWidth -or -not $deviceHeight) { continue }

        $ratio = if ($ratioText) { [int]$ratioText } else { 1 }
        if ($name -match 'landscape') {
            $width = [int]$deviceHeight * $ratio
            $height = [int]$deviceWidth * $ratio
        } else {
            $width = [int]$deviceWidth * $ratio
            $height = [int]$deviceHeight * $ratio
        }

        $deviceSplash = New-SplashImage -Source $sourceBadge -Width $width -Height $height
        try { Save-Png -Image $deviceSplash -Name $name } finally { $deviceSplash.Dispose() }
    }
} finally { $sourceBadge.Dispose() }

# Square emblem for the in-app logo; full badge for the welcome banner.
$logo = New-SquareImage -Path $emblem -Size 512
try { Save-Png -Image $logo -Name 'brand-logo.png' } finally { $logo.Dispose() }
Copy-Item -LiteralPath $badge -Destination (Join-Path $publicDir 'brand-badge.png') -Force
Write-Output 'wrote brand-logo.png and brand-badge.png'
