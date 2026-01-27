#!/usr/bin/env pwsh
# rotate-certificate-pins.ps1
# Uso interno de desarrollo: obtiene fingerprints SHA-256 de hosts configurados y muestra si expiran pronto.
# NO COMMITEAR este archivo con secrets reales. Solo para desarrollo local.

param(
  [string[]]$Hosts = @(
    "axtvqnozatbmllvwzuim.supabase.co",
    "api.openai.com"
  ),
  [int]$WarnDays = 30
)

function Get-TlsInfo {
  param([Parameter(Mandatory=$true)][string]$Host)

  try {
    $tcp = [System.Net.Sockets.TcpClient]::new($Host, 443)
    $ssl = [System.Net.Security.SslStream]::new($tcp.GetStream(), $false, ({ $true }))
    $ssl.AuthenticateAsClient($Host)

    $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($ssl.RemoteCertificate)

    $hashBytes = $cert.GetCertHash([System.Security.Cryptography.HashAlgorithmName]::SHA256)
    $fp = ($hashBytes | ForEach-Object { $_.ToString("X2") }) -join ":"

    $daysUntil = ($cert.NotAfter - (Get-Date)).Days

    [PSCustomObject]@{
      Host = $Host
      Sha256Fingerprint = $fp
      NotBefore = $cert.NotBefore
      NotAfter = $cert.NotAfter
      DaysUntilExpiry = $daysUntil
      Warn = $daysUntil -lt $WarnDays
    }
  }
  catch {
    Write-Error "❌ Error obteniendo TLS info para $Host : $($_.Exception.Message)"
  }
  finally {
    if ($tcp) { $tcp.Close() }
  }
}

Write-Host "🔐 Certificate Pinning Rotation Helper" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$results = foreach ($h in $Hosts) {
  Get-TlsInfo -Host $h
}

Write-Host "`n📋 Reporte de fingerprints y expiración:" -ForegroundColor Yellow
foreach ($r in $results) {
  $color = if ($r.Warn) { "Red" } else { "Green" }
  Write-Host "`n🌐 $($r.Host)" -ForegroundColor $color
  Write-Host "   SHA256: $($r.Sha256Fingerprint)" -ForegroundColor White
  Write-Host "   Vigente desde: $($r.NotBefore)" -ForegroundColor Gray
  Write-Host "   Expira el:    $($r.NotAfter)" -ForegroundColor Gray
  Write-Host "   Días restantes: $($r.DaysUntilExpiry)" -ForegroundColor $color
}

$anyWarn = $results | Where-Object { $_.Warn }
if ($anyWarn) {
  Write-Host "`n⚠️  ATENCIÓN: Hay certificados que expiran en menos de $WarnDays días. Considera rotar pronto." -ForegroundColor Red
} else {
  Write-Host "`n✅ Todos los certificados están vigentes por más de $WarnDays días." -ForegroundColor Green
}

Write-Host "`n📦 Variables para .env / Vercel:" -ForegroundColor Cyan
$hostsStr = $results.Host -join ","
$fingerprintsStr = $results.Sha256Fingerprint -join ","

Write-Host "`nVITE_PINNED_CERT_HOSTS=`"$hostsStr`""
Write-Host "VITE_PINNED_CERT_FINGERPRINTS=`"$fingerprintsStr`""
Write-Host "VITE_ENFORCE_HTTPS_IN_PROD=`"true`""
Write-Host "VITE_ENFORCE_HOST_ALLOWLIST_IN_PROD=`"true`""

Write-Host "`n🔄 Para rotar:" -ForegroundColor Yellow
Write-Host "1) Obtén el nuevo fingerprint con este script."
Write-Host "2) Actualiza las variables en Vercel (Production) y/o CI."
Write-Host "3) Deploya la app (web y Android/iOS)."
Write-Host "4) Verifica que la app conecte sin errores."
