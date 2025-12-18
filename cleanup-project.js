import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURACIÓN DE RUTAS
const ROOT_DIR = __dirname;
const SRC_DIR = path.join(ROOT_DIR, 'src');
const ARCHIVE_DIR = path.join(ROOT_DIR, '_ARCHIVE_2025', 'cleanup_batch_1');

// LISTAS DE OBJETIVOS
const JUNK_FILES = [
    'Profilesinglebckntftsx.ts',
    'error_log.txt',
    'stderr.txt',
    'check-imports.ps1',
    'build-and-analyze.ps1',
    'Auditoria_Proyecto.ps1',
    'respaldo_tree.txt'
];

const LEGACY_STYLES = [
    'couple.css',
    'single.css',
    'base.css' // Mantener index.css, mover el resto que causa conflicto
];

// 1. PREPARAR QUIRÓFANO (Crear carpetas de respaldo)
if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
const styleArchive = path.join(ARCHIVE_DIR, 'styles');
if (!fs.existsSync(styleArchive)) fs.mkdirSync(styleArchive);

// FUNCIÓN HELPER: ESCANEAR ARCHIVOS RECURSIVAMENTE
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

console.log("🚀 INICIANDO CIRUGÍA DE CÓDIGO...");

// 2. OPERACIÓN: LIMPIEZA DE RAÍZ (Basura)
JUNK_FILES.forEach(file => {
    const filePath = path.join(ROOT_DIR, file);
    if (fs.existsSync(filePath)) {
        console.log(`🗑️ Archivando basura: ${file}`);
        fs.renameSync(filePath, path.join(ARCHIVE_DIR, file));
    }
});

// 3. OPERACIÓN: NEUTRALIZAR ESTILOS CONFLICTIVOS (Tumor Visual)
const stylesDir = path.join(SRC_DIR, 'styles');
if (fs.existsSync(stylesDir)) {
    LEGACY_STYLES.forEach(file => {
        const filePath = path.join(stylesDir, file);
        if (fs.existsSync(filePath)) {
            console.log(`🎨 Archivando estilo legado (Conflicto Tailwind): ${file}`);
            fs.renameSync(filePath, path.join(styleArchive, file));
        }
    });
}

// 4. OPERACIÓN: CONSOLIDACIÓN DE SERVICIOS (Lógica)
// Mover CoupleProfilesService de features a services
const oldServicePath = path.join(SRC_DIR, 'features', 'profile', 'CoupleProfilesService.ts');
const newServiceDir = path.join(SRC_DIR, 'services', 'couple');
const newServicePath = path.join(newServiceDir, 'CoupleProfilesService.ts');

if (fs.existsSync(oldServicePath)) {
    if (!fs.existsSync(newServiceDir)) fs.mkdirSync(newServiceDir, { recursive: true });
    
    // Si ya existe en destino, no sobrescribir ciegamente, pero en este caso unificamos
    if (!fs.existsSync(newServicePath)) {
        console.log(`⚙️ Moviendo Service: features -> services/couple`);
        fs.renameSync(oldServicePath, newServicePath);
    } else {
        console.log(`⚠️ El servicio ya existía en destino. Archivando versión de features.`);
        fs.renameSync(oldServicePath, path.join(ARCHIVE_DIR, 'CoupleProfilesService_old.ts'));
    }

    // ACTUALIZAR IMPORTS EN TODO EL PROYECTO
    console.log("🔄 Actualizando referencias de importación...");
    const allFiles = getAllFiles(SRC_DIR);
    let updatedCount = 0;
    
    allFiles.forEach(filePath => {
        let content = fs.readFileSync(filePath, 'utf8');
        const regex = /from ['"]@\/features\/profile\/CoupleProfilesService['"]/g;
        if (regex.test(content)) {
            const newContent = content.replace(regex, "from '@/services/couple/CoupleProfilesService'");
            fs.writeFileSync(filePath, newContent, 'utf8');
            updatedCount++;
            console.log(`   └─ Corregido en: ${path.basename(filePath)}`);
        }
    });
    console.log(`✅ Total imports corregidos: ${updatedCount}`);
}

console.log("🏁 OPERACIÓN COMPLETADA. PACIENTE ESTABLE.");
