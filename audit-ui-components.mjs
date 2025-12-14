import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uiDir = path.join(__dirname, 'src/components/ui');
const srcDir = path.join(__dirname, 'src');

// Get all UI component files
const uiFiles = fs.readdirSync(uiDir)
  .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
  .map(f => f.replace(/\.(tsx|ts)$/, ''));

// Read all source files
function getAllSourceFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      getAllSourceFiles(path.join(dir, entry.name), files);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.jsx') || entry.name.endsWith('.js'))) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

const sourceFiles = getAllSourceFiles(srcDir);
const sourceContent = sourceFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

// Check usage of each component
const unused = [];
const used = [];

for (const comp of uiFiles) {
  // Skip index files
  if (comp === 'index') continue;
  
  // Check for imports
  const patterns = [
    new RegExp(`from\\s+['\"].*ui/${comp}['\"]`, 'g'),
    new RegExp(`from\\s+['\"].*ui['\"].*\\b${comp}\\b`, 'g'),
    new RegExp(`import.*\\b${comp}\\b.*from.*ui`, 'g'),
  ];
  
  let found = false;
  for (const pattern of patterns) {
    if (pattern.test(sourceContent)) {
      found = true;
      break;
    }
  }
  
  if (found) {
    used.push(comp);
  } else {
    unused.push(comp);
  }
}

console.log('\n=== COMPONENTES UI UTILIZADOS ===');
console.log(`Total: ${used.length}`);
used.sort().forEach(c => console.log(`  ✓ ${c}`));

console.log('\n=== COMPONENTES UI NO UTILIZADOS (ZOMBIES) ===');
console.log(`Total: ${unused.length}`);
unused.sort().forEach(c => console.log(`  ✗ ${c}`));

// Save report
const report = {
  timestamp: new Date().toISOString(),
  totalComponents: uiFiles.length,
  used: used.length,
  unused: unused.length,
  unusedComponents: unused.sort(),
  usedComponents: used.sort()
};

fs.writeFileSync(
  path.join(__dirname, 'AUDIT_UI_COMPONENTS.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n✓ Reporte guardado en AUDIT_UI_COMPONENTS.json');
