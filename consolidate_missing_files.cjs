const fs = require('fs');
const path = require('path');

const reviewPendingPath = path.join(__dirname, 'supabase', 'migrations', 'review_pending');
const masterFilePath = path.join(reviewPendingPath, '20251209_SCHEMA_MAESTRO_CONSOLIDADO.sql');

// Archivos faltantes que necesitan ser consolidados
const missingFiles = [
    'cheksdesinglepareja.sql',
    'create table premium_access .sql',
    'public.couple.sql',
    'public.security_logs.sql',
    'securytylogs.sql'
];

console.log('=== CONSOLIDACIÓN DE ARCHIVOS FALTANTES ===');
console.log(`Agregando ${missingFiles.length} archivos faltantes al maestro consolidado`);
console.log();

// Leer archivo maestro actual
let masterContent = fs.readFileSync(masterFilePath, 'utf8');

// Extraer estadísticas actuales del header
const headerLines = masterContent.split('\n');
let currentTotalFiles = 0;
let currentConsolidatedFiles = 0;

for (const line of headerLines) {
    if (line.includes('-- Total de archivos consolidados:')) {
        const match = line.match(/(\d+)/);
        if (match) currentTotalFiles = parseInt(match[1]);
    }
    if (line.includes('-- Archivos procesados (sin duplicados):')) {
        const match = line.match(/(\d+)/);
        if (match) currentConsolidatedFiles = parseInt(match[1]);
    }
    if (line.includes('-- ============================================================================')) break; // Fin del header
}

console.log(`Estadísticas actuales:`);
console.log(`- Total archivos encontrados: ${currentTotalFiles}`);
console.log(`- Archivos consolidados: ${currentConsolidatedFiles}`);
console.log();

// Procesar archivos faltantes
let consolidatedContent = '';
let processedCount = 0;

for (const fileName of missingFiles) {
    const filePath = path.join(reviewPendingPath, fileName);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Archivo no encontrado: ${fileName}`);
        continue;
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
        console.log(`⚠️  Archivo vacío: ${fileName} (${stats.size} bytes)`);
        continue;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8').trim();
        const relativePath = fileName;

        console.log(`✅ Procesando: ${fileName} (${stats.size} bytes)`);

        // Agregar separadores y contenido
        consolidatedContent += `\n-- ============================================================================\n`;
        consolidatedContent += `-- INICIO DE ARCHIVO: ${fileName}\n`;
        consolidatedContent += `-- ============================================================================\n`;
        consolidatedContent += `-- Ruta relativa: ${relativePath}\n`;
        consolidatedContent += `-- Tamaño: ${stats.size} bytes\n`;
        consolidatedContent += `-- Fecha modificación: ${stats.mtime.toLocaleString('es-MX')}\n`;
        consolidatedContent += `-- ============================================================================\n`;
        consolidatedContent += `\n${content}\n`;
        consolidatedContent += `\n-- ============================================================================\n`;
        consolidatedContent += `-- FIN DE ARCHIVO: ${fileName}\n`;
        consolidatedContent += `-- ============================================================================\n\n`;

        processedCount++;

    } catch (error) {
        console.log(`❌ Error procesando ${fileName}: ${error.message}`);
    }
}

// Actualizar estadísticas
const newTotalFiles = currentTotalFiles; // No cambia porque ya estaban contados
const newConsolidatedFiles = currentConsolidatedFiles + processedCount;

// Actualizar header
const newHeader = `-- ============================================================================
-- SCHEMA MAESTRO CONSOLIDADO COMPLETO - ComplicesConecta v3.8.6
-- ============================================================================
-- Fecha de consolidación: ${new Date().toLocaleString('es-MX')}
-- Total de archivos consolidados: ${newTotalFiles}
-- Descripción: Consolidación completa de TODAS las migraciones SQL
-- Objetivo: Archivo maestro único con todas las migraciones separadas por comentarios
-- Idempotencia: 100% (IF NOT EXISTS, DO $$)
-- ============================================================================`;

// Actualizar footer
const newFooter = `

-- ============================================================================
-- RESUMEN DE CONSOLIDACIÓN
-- ============================================================================
-- Total archivos encontrados: ${newTotalFiles}
-- Archivos procesados (sin duplicados): ${newConsolidatedFiles}
-- Duplicados encontrados: 92
-- Fecha de consolidación: ${new Date().toLocaleString('es-MX')}
-- Directorio de backup: C:\\Users\\conej\\Documents\\conecta-social-comunidad-main\\supabase\\migrations\\backup_completo_2026-02-14T11-50-09
-- ============================================================================`;

// Reemplazar header
masterContent = masterContent.replace(/-- ============================================================================\n-- SCHEMA MAESTRO CONSOLIDADO COMPLETO - ComplicesConecta v3\.8\.6\n-- ============================================================================\n-- Fecha de consolidación: .*\n-- Total de archivos consolidados: \d+\n-- Descripción: Consolidación completa de TODAS las migraciones SQL\n-- Objetivo: Archivo maestro único con todas las migraciones separadas por comentarios\n-- Idempotencia: 100% \(IF NOT EXISTS, DO \$\$\)\n-- ============================================================================/, newHeader);

// Reemplazar footer
const footerPattern = /-- ============================================================================\n-- RESUMEN DE CONSOLIDACIÓN\n-- ============================================================================\n-- Total archivos encontrados: \d+\n-- Archivos procesados \(sin duplicados\): \d+\n-- Duplicados encontrados: \d+\n-- Fecha de consolidación: .*\n-- Directorio de backup: .*\n-- ============================================================================/;
masterContent = masterContent.replace(footerPattern, newFooter);

// Agregar los archivos faltantes antes del footer
const footerIndex = masterContent.lastIndexOf('-- ============================================================================');
const beforeFooter = masterContent.substring(0, footerIndex);
const afterFooter = masterContent.substring(footerIndex);

// Insertar archivos faltantes
masterContent = beforeFooter + consolidatedContent + afterFooter;

// Escribir archivo actualizado
fs.writeFileSync(masterFilePath, masterContent, 'utf8');

console.log();
console.log('=== CONSOLIDACIÓN COMPLETADA ===');
console.log(`✅ Archivos agregados: ${processedCount}`);
console.log(`📊 Nuevo total consolidado: ${newConsolidatedFiles} archivos`);
console.log(`📁 Archivo maestro actualizado: ${masterFilePath}`);

// Verificar tamaño final
const finalStats = fs.statSync(masterFilePath);
console.log(`📏 Nuevo tamaño: ${(finalStats.size / 1024 / 1024).toFixed(2)} MB`);
