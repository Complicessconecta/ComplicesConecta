import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const renameFiles = (dir, prefix) => {
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return;
  }

  // Filter for images
  const files = fs.readdirSync(dir).filter(f => f.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/));
  console.log(`Found ${files.length} files in ${dir}`);

  // Sort to ensure deterministic order if needed, or random? User didn't specify order, just "sequential".
  // Keeping original order (alphabetical) is fine.
  files.sort();

  files.forEach((file, index) => {
    const ext = path.extname(file).toLowerCase();
    const newName = `${prefix}${index + 1}${ext}`;
    const oldPath = path.join(dir, file);
    const newPath = path.join(dir, newName);
    
    if (file !== newName) {
      try {
          fs.renameSync(oldPath, newPath);
          console.log(`Renamed ${file} -> ${newName}`);
      } catch (e) {
          console.error(`Error renaming ${file}:`, e);
      }
    }
  });
};

const srcDir = path.resolve(__dirname, 'src/assets/people/male/privado');
console.log('Processing srcDir:', srcDir);
renameFiles(srcDir, 'aprivadocouple');

const publicDir = path.resolve(__dirname, 'public/assets/people/single/privado');
console.log('Processing publicDir:', publicDir);
renameFiles(publicDir, 'aprivadosingle');
