// Script para corregir errores de logger.error
const fs = require('fs');
const path = require('path');

// Función para corregir errores de logger.error en un archivo
function fixLoggerErrors(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Patrón para encontrar logger.error con Error o PostgrestError
  const errorPattern = /logger\.error\((['"`][^'"`]+['"`]),\s*(error\s+as\s+(Error|PostgrestError)|error)\s*\);?/g;

  // Reemplazar con formato correcto
  const fixedContent = content.replace(errorPattern, (match, message, errorType, errorClass) => {
    if (errorType.includes('as')) {
      // Caso: logger.error("mensaje", error as Error);
      return `logger.error(${message}, { error: error.message, stack: error.stack });`;
    } else {
      // Caso: logger.error("mensaje", error);
      return `logger.error(${message}, { error: error.message, details: error.details });`;
    }
  });

  // Patrón para errores de tipo unknown
  const unknownPattern = /logger\.error\((['"`][^'"`]+['"`]),\s*error\s*\);?/g;
  const fixedUnknown = fixedContent.replace(unknownPattern, (match, message) => {
    return `logger.error(${message}, { error: error instanceof Error ? error.message : String(error) });`;
  });

  if (content !== fixedUnknown) {
    fs.writeFileSync(filePath, fixedUnknown);
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

// Archivos a corregir
const filesToFix = [
  'src/services/social/social/postsService.ts',
  'src/services/social/social/SmartMatchingService.ts',
  'src/utils/emailValidation.ts',
  'src/services/auth/auth/ContentProtectionService.ts',
  'src/services/auth/auth/UserIdentificationService.ts',
  'src/services/auth/auth/UserVerificationService.ts',
  'src/services/auth/mfa/MFAService.ts',
  'src/services/auth/permanentBan.ts',
  'src/services/core/DesktopNotificationService.ts',
  'src/services/core/ErrorAlertService.ts',
  'src/services/core/RateLimitService.ts'
];

// Corregir cada archivo
let fixedCount = 0;
filesToFix.forEach(file => {
  if (fixLoggerErrors(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);
