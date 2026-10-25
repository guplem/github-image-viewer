# Draws the extension icons.
# Run from the project root:  powershell -ExecutionPolicy Bypass -File scripts/makeIcons.ps1
# The artwork is a framed photo (sky, sun, two hills) between a left and a right arrow, on a dark rounded square.

Add-Type -AssemblyName System.Drawing

$source = 512
$bitmap = New-Object System.Drawing.Bitmap($source, $source)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::Transparent)

function New-RoundedRectangle([float]$left, [float]$top, [float]$right, [float]$bottom, [float]$radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $radius * 2
  $path.AddArc($left, $top, $diameter, $diameter, 180, 90)
  $path.AddArc($right - $diameter, $top, $diameter, $diameter, 270, 90)
  $path.AddArc($right - $diameter, $bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($left, $bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Brush([int]$red, [int]$green, [int]$blue) {
  return New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, $red, $green, $blue))
}

# Dark rounded square background.
$graphics.FillPath((New-Brush 32 33 36), (New-RoundedRectangle 0 0 $source $source ([int]($source * 0.22))))

# The photo: a light frame around a sky, with a sun and two hills.
$graphics.FillPath((New-Brush 240 246 252), (New-RoundedRectangle 128 136 384 376 24))
$graphics.FillPath((New-Brush 84 174 255), (New-RoundedRectangle 152 160 360 352 10))
$graphics.FillEllipse((New-Brush 255 202 40), 296, 184, 44, 44)
$graphics.FillPolygon((New-Brush 26 127 55), [System.Drawing.Point[]]@((New-Object System.Drawing.Point(152, 352)), (New-Object System.Drawing.Point(224, 248)), (New-Object System.Drawing.Point(296, 352))))
$graphics.FillPolygon((New-Brush 46 160 67), [System.Drawing.Point[]]@((New-Object System.Drawing.Point(240, 352)), (New-Object System.Drawing.Point(296, 280)), (New-Object System.Drawing.Point(360, 352))))

# The two arrows: the previous and the next image.
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 240, 246, 252)), 26
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$graphics.DrawLines($pen, [System.Drawing.Point[]]@((New-Object System.Drawing.Point(92, 212)), (New-Object System.Drawing.Point(60, 256)), (New-Object System.Drawing.Point(92, 300))))
$graphics.DrawLines($pen, [System.Drawing.Point[]]@((New-Object System.Drawing.Point(420, 212)), (New-Object System.Drawing.Point(452, 256)), (New-Object System.Drawing.Point(420, 300))))

$outputDirectory = Join-Path (Split-Path -Parent $PSScriptRoot) 'icons'
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

foreach ($size in 16, 32, 48, 128) {
  $scaled = New-Object System.Drawing.Bitmap($size, $size)
  $scaledGraphics = [System.Drawing.Graphics]::FromImage($scaled)
  $scaledGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $scaledGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $scaledGraphics.DrawImage($bitmap, 0, 0, $size, $size)
  $scaled.Save((Join-Path $outputDirectory "icon$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $scaledGraphics.Dispose()
  $scaled.Dispose()
  Write-Host "wrote icon$size.png"
}

$graphics.Dispose()
$bitmap.Dispose()
