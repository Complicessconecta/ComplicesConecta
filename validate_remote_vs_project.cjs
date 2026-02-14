const fs = require('fs');
const path = require('path');

// Migraciones aplicadas en remoto (desde la API)
const remoteMigrations = [
  "20240523000000", "20250101000000", "20250116", "20250117", "20250119000000", "20250119000001", "20250119000002",
  "20250121000000", "20250122000000", "20250123000000", "20250124000000", "20251027210460", "20251027210462",
  "20251027210463", "20251027210464", "20251027210465", "20251027210466", "20251027210467", "20251028060000",
  "20251030000001", "20251031000000", "20251102000000", "20251102010000", "20251103000000", "20251103000001",
  "20251106010000", "20251106020000", "20251106030000", "20251106040000", "20251106043953", "20251106043954",
  "20251108000003", "20251108000004", "20251113080001", "20251113080002", "20251115120000", "20251115130000",
  "20251208120000", "20251209", "20251216100001", "20251216100002", "20251216100005", "20251216100006",
  "20251216100007", "20251216100008", "20251216100011", "20251216100012", "20251216100013", "20251216100015",
  "20251216100017", "20251216100021", "20251216100022", "20251216100024", "20251216100025", "20251216100026",
  "20251216100027", "20251216100028", "20251216100029", "20251216100030", "20251216100031", "20251216100032",
  "20251216100033", "20251216100035", "20251216100036", "20251216100037", "20251216100038", "20251216100039",
  "20251216100040", "20251216100041", "20251216100042", "20251216100043", "20251216100044", "20251216100045",
  "20251216120000", "20251217140000", "20251218120003", "20260108000000", "20260108011600", "20260108011800",
  "20260109", "20260110000001", "20260110000002", "20260110000003", "20260110000004", "20260111031111",
  "20260111031120", "20260111031125", "20260111031129", "20260113000000", "20260113000001", "20260113000002",
  "20260113000003", "20260114222700", "20260114223000", "20260114223500", "20260115030549", "20260116021400",
  "20260117000000", "20260117000001", "202601170002", "202601170003", "202601170004", "202601170005",
  "202601170006", "202601170007", "202601170008", "202601170009", "202601170010", "202601170011",
  "202601170012", "202601170013", "202601170014", "202601170015", "202601170016", "202601170017",
  "202601170018", "202601170019", "202601170020", "202601170021", "202601170022", "202601170023",
  "202601170024", "202601170025", "202601170026", "202601170027", "202601170028", "202601170029",
  "20260120000010", "20260120000020", "20260120000030", "20260120000031", "20260120000032", "20260120000033",
  "20260120000034", "20260120000035", "20260120000036", "20260120000037", "20260120000038", "20260120000039",
  "20260120000040", "20260122065739", "20260124012900", "20260125", "20260126203000", "20260126210000",
  "20260127030926", "20260127040000", "20260127041000", "20260127042000", "20260127064442", "20260127065108",
  "20260127065829", "20260127071026", "20260127071248", "20260127071252", "20260131054400", "20260131054600",
  "20260131112656", "20260131112908", "20260131112939", "20260131113625", "20260131113849", "20260131114614",
  "20260131115308", "20260131115534", "20260131115538", "20260203222200"
];

// Función para obtener todas las migraciones locales
function getLocalMigrations() {
  const migrationsPath = path.join(__dirname, 'supabase', 'migrations');
  const localMigrations = new Set();

  function scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.sql') && !item.includes('.bak')) {
        // Extraer timestamp del nombre del archivo
        const timestampMatch = item.match(/^(\d{14,})/);
        if (timestampMatch) {
          localMigrations.add(timestampMatch[1]);
        }
      }
    }
  }

  scanDirectory(migrationsPath);
  return localMigrations;
}

// Función para buscar archivos TypeScript con problemas de tipos
function scanForTypeIssues() {
  const issues = [];
  const srcPath = path.join(__dirname, 'src');

  function scanDirectory(dirPath, relativePath = '') {
    if (!fs.existsSync(dirPath)) return;

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relPath = path.join(relativePath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath, relPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');

        // Buscar patrones problemáticos
        const issuesInFile = [];

        // as any
        const asAnyMatches = content.match(/as\s+any/g);
        if (asAnyMatches) {
          issuesInFile.push(`${asAnyMatches.length} usos de 'as any'`);
        }

        // : any
        const anyTypeMatches = content.match(/:\s*any[^a-zA-Z_]/g);
        if (anyTypeMatches) {
          issuesInFile.push(`${anyTypeMatches.length} tipos 'any'`);
        }

        // null! o undefined!
        const nullUndefinedMatches = content.match(/(null|undefined)!/g);
        if (nullUndefinedMatches) {
          issuesInFile.push(`${nullUndefinedMatches.length} usos de 'null!' o 'undefined!'`);
        }

        // unknown sin tipado
        const unknownMatches = content.match(/:\s*unknown[^a-zA-Z_]/g);
        if (unknownMatches) {
          issuesInFile.push(`${unknownMatches.length} tipos 'unknown' sin resolver`);
        }

        if (issuesInFile.length > 0) {
          issues.push({
            file: relPath,
            issues: issuesInFile,
            path: fullPath
          });
        }
      }
    }
  }

  scanDirectory(srcPath, 'src');
  return issues;
}

// Ejecutar análisis
console.log('=== ANÁLISIS COMPLETO: REMOTO vs LOCAL ===');

// 1. Comparar migraciones
const localMigrations = getLocalMigrations();
console.log(`📊 Migraciones en remoto: ${remoteMigrations.length}`);
console.log(`📊 Migraciones locales: ${localMigrations.size}`);

// Encontrar diferencias
const missingInRemote = [];
const extraInRemote = [];

for (const local of localMigrations) {
  if (!remoteMigrations.includes(local)) {
    missingInRemote.push(local);
  }
}

for (const remote of remoteMigrations) {
  if (!localMigrations.has(remote)) {
    extraInRemote.push(remote);
  }
}

console.log(`❌ Faltan en remoto: ${missingInRemote.length}`);
console.log(`➕ Extras en remoto: ${extraInRemote.length}`);

// 2. Escanear problemas de tipos
console.log('\n=== ESCANEO DE PROBLEMAS DE TIPOS ===');
const typeIssues = scanForTypeIssues();
console.log(`🔍 Archivos con problemas de tipos: ${typeIssues.length}`);

// Generar reporte MD
const reportPath = path.join(__dirname, 'VALIDACION_REMOTO_PROYECTO.md');

let reportContent = `# 🔍 VALIDACIÓN REMOTO vs PROYECTO LOCAL

**Fecha de validación:** ${new Date().toLocaleString('es-ES')}
**Proyecto:** CómplicesConecta

## 📊 RESUMEN EJECUTIVO

- **Migraciones en remoto:** ${remoteMigrations.length}
- **Migraciones locales:** ${localMigrations.size}
- **Faltan en remoto:** ${missingInRemote.length}
- **Extras en remoto:** ${extraInRemote.length}
- **Archivos con problemas de tipos:** ${typeIssues.length}

## 🗄️ MIGRACIONES SQL

### ❌ MIGRACIONES QUE FALTAN EN REMOTO
${missingInRemote.length > 0 ? missingInRemote.map(m => `- **${m}**`).join('\n') : '**✅ Todas las migraciones locales están en remoto**'}

### ➕ MIGRACIONES EXTRAS EN REMOTO
${extraInRemote.length > 0 ? extraInRemote.map(m => `- **${m}**`).join('\n') : '**ℹ️ No hay migraciones extras en remoto**'}

## 🔧 PROBLEMAS DE TIPOS IDENTIFICADOS

`;

typeIssues.forEach(issue => {
  reportContent += `### 📁 ${issue.file}\n`;
  reportContent += `**Ubicación:** \`${issue.path}\`\n\n`;
  reportContent += `**Problemas encontrados:**\n`;
  issue.issues.forEach(problem => {
    reportContent += `- ❌ ${problem}\n`;
  });
  reportContent += `\n`;
});

if (typeIssues.length === 0) {
  reportContent += `**✅ No se encontraron problemas de tipos críticos**\n\n`;
}

reportContent += `# 🚀 PLAN DE RESOLUCIÓN EN FASES

## FASE 1: SINCRONIZACIÓN DE MIGRACIONES (Prioridad CRÍTICA)
**Tiempo estimado:** 1-2 horas
**Estado:** ${missingInRemote.length === 0 ? '✅ COMPLETADO' : '❌ PENDIENTE'}

### Acciones requeridas:
${missingInRemote.length > 0 ?
  missingInRemote.map(m => `1. **Aplicar migración ${m}** a base de datos remota\n`).join('') +
  `2. **Verificar aplicación exitosa** de cada migración\n` +
  `3. **Actualizar documentación** de estado de migraciones\n`
  : '1. ✅ Todas las migraciones locales están aplicadas en remoto\n'
}

## FASE 2: LIMPIEZA DE TIPOS (Prioridad ALTA)
**Tiempo estimado:** 4-6 horas
**Estado:** ${typeIssues.length === 0 ? '✅ COMPLETADO' : '❌ PENDIENTE'}

### Archivos que requieren atención:
${typeIssues.map(issue => `#### ${issue.file}\n- **Problemas:** ${issue.issues.join(', ')}\n- **Solución:** Reemplazar tipos problemáticos con tipos específicos de TypeScript\n`).join('\n')}

### Estrategia de corrección:
1. **Reemplazar \`as any\`** con tipos específicos o unknown
2. **Evitar tipos \`any\` en parámetros** y retornos de funciones
3. **Usar tipos de unión específicos** en lugar de any
4. **Implementar proper type guards** para validación de tipos
5. **Crear interfaces específicas** para objetos complejos

## FASE 3: VALIDACIÓN FINAL (Prioridad MEDIA)
**Tiempo estimado:** 1-2 horas

### Checklist de validación:
- ✅ **Compilación TypeScript** sin errores
- ✅ **Build completo** exitoso
- ✅ **Linting** sin problemas críticos
- ✅ **Tests** pasando (mínimo 95%)
- ✅ **Migraciones** sincronizadas entre local y remoto
- ✅ **Tipos** completamente tipados

## ⚠️ RIESGOS Y CONSIDERACIONES

### Riesgos identificados:
1. **Inconsistencia de datos** si migraciones faltantes afectan esquemas existentes
2. **Ruptura de funcionalidad** por cambios de tipos que alteren lógica
3. **Problemas de compatibilidad** con dependencias que esperan tipos específicos

### Medidas preventivas:
- **Backup completo** antes de aplicar cambios
- **Testing exhaustivo** después de cada cambio
- **Despliegue gradual** con monitoreo continuo
- **Rollback plan** preparado para reversiones

### Priorización de correcciones:
1. **Migraciones críticas** primero (esquemas de datos)
2. **Tipos en lógica core** segundo (autenticación, perfiles)
3. **Tipos en componentes UI** tercero (menos críticos)

---

**Reporte generado automáticamente por sistema de validación**
**Timestamp:** ${new Date().toISOString()}
`;

fs.writeFileSync(reportPath, reportContent, 'utf8');

console.log(`\n✅ Reporte generado: ${reportPath}`);
console.log(`📊 Resumen:`);
console.log(`   - Migraciones remoto: ${remoteMigrations.length}`);
console.log(`   - Migraciones local: ${localMigrations.size}`);
console.log(`   - Faltan en remoto: ${missingInRemote.length}`);
console.log(`   - Extras en remoto: ${extraInRemote.length}`);
console.log(`   - Problemas de tipos: ${typeIssues.length}`);
