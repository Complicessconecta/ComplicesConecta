import fs from 'fs';
import path from 'path';

const zombieComponents = [
  'AdaptiveBackground.tsx',
  'AnimatedCard.tsx',
  'AnimatedLoader.tsx',
  'AnimatedTabs.tsx',
  'FeatureCards.tsx',
  'GlassContainer.tsx',
  'ImageWithFallback.tsx',
  'InfoCard.tsx',
  'LazyImage.tsx',
  'LogoutButton.tsx',
  'MicroInteractions.tsx',
  'OptimizedImage.tsx',
  'ParticlesBackground.tsx',
  'RandomBackground.tsx',
  'ResponsiveGrid.tsx',
  'SkeletonComponents.tsx',
  'TermsModal.tsx',
  'UnifiedModal.tsx',
  'VisualHierarchy.tsx',
  'WhyChooseSection.tsx',
  'aspect-ratio.tsx',
  'calendar.tsx',
  'card-hover-effect.tsx',
  'carousel.tsx',
  'chart.tsx',
  'collapsible.tsx',
  'command.tsx',
  'compliance-signup-form.tsx',
  'context-menu.tsx',
  'drawer.tsx',
  'events-carousel.tsx',
  'file-upload.tsx',
  'form.tsx',
  'hover-card.tsx',
  'input-otp.tsx',
  'menubar.tsx',
  'navigation-menu.tsx',
  'pagination.tsx',
  'popover.tsx',
  'resizable.tsx',
  'sonner.tsx',
  'table.tsx',
  'toggle-group.tsx',
  'vip-booking-modal.tsx'
];

const uiDir = path.join(process.cwd(), 'src/components/ui');
const zombieDir = path.join(uiDir, '_unused_zombies');

let moved = 0;
let failed = 0;
let alreadyMoved = 0;

for (const comp of zombieComponents) {
  const source = path.join(uiDir, comp);
  const dest = path.join(zombieDir, comp);
  
  try {
    if (fs.existsSync(source)) {
      if (fs.existsSync(dest)) {
        alreadyMoved++;
      } else {
        fs.renameSync(source, dest);
        moved++;
      }
    } else {
      failed++;
    }
  } catch (error) {
    console.error(`Error moving ${comp}:`, error.message);
    failed++;
  }
}

console.log(`\n✅ Componentes movidos: ${moved}`);
console.log(`⚠️  Ya estaban en cuarentena: ${alreadyMoved}`);
console.log(`❌ No encontrados/Errores: ${failed}`);
console.log(`\n📁 Total en cuarentena: ${moved + alreadyMoved}/${zombieComponents.length}`);
