# Script de Reparación de Migraciones de Supabase
# Extrae timestamps de archivos .sql y ejecuta supabase migration repair para cada uno

Write-Host "🔧 Iniciando reparación de migraciones..." -ForegroundColor Cyan

# Array de timestamps extraídos de los archivos .sql
$timestamps = @(
    "20250101000000",
    "20251027210460",
    "20251027210462",
    "20251027210463",
    "20251027210464",
    "20251027210465",
    "20251027210466",
    "20251027210467",
    "20251028060000",
    "20251030000001",
    "20251031000000",
    "20251102000000",
    "20251102010000",
    "20251103000000",
    "20251103000001",
    "20251106000000",
    "20251106000001",
    "20251106010000",
    "20251106020000",
    "20251106030000",
    "20251106040000",
    "20251106043953",
    "20251106043954",
    "20251108000003",
    "20251108000004",
    "20251113080001",
    "20251113080002",
    "20251115120000",
    "20251115130000",
    "20251216100001",
    "20251216100002",
    "20251216100003",
    "20251216100004",
    "20251216100005",
    "20251216100006"
)

$successCount = 0
$failureCount = 0

# Ejecutar repair para cada timestamp
foreach ($timestamp in $timestamps) {
    Write-Host "⏳ Reparando migración: $timestamp" -ForegroundColor Yellow
    
    try {
        & supabase migration repair --status applied $timestamp
        $successCount++
        Write-Host "✅ Migración $timestamp reparada exitosamente" -ForegroundColor Green
    } catch {
        $failureCount++
        Write-Host "❌ Error reparando migración $timestamp : $_" -ForegroundColor Red
    }
}

Write-Host "`n📊 Resumen:" -ForegroundColor Cyan
Write-Host "✅ Exitosas: $successCount" -ForegroundColor Green
Write-Host "❌ Fallidas: $failureCount" -ForegroundColor Red

# Ejecutar db push para confirmar
Write-Host "`n🚀 Ejecutando supabase db push..." -ForegroundColor Cyan
& supabase db push

Write-Host "`n✨ Reparación completada!" -ForegroundColor Green
