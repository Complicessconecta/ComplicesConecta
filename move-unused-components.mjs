import fs from 'fs';
import path from 'path';

const unusedComponents = [
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
const unusedDir = path.join(uiDir, '_unused');

let moved = 0;
let failed = 0;

for (const comp of unusedComponents) {
  const source = path.join(uiDir, comp);
  const dest = path.join(unusedDir, comp);
  
  try {
    if (fs.existsSync(source)) {
      fs.renameSync(source, dest);
      moved++;
    } else {
      failed++;
    }
  } catch (error) {
    console.error(`Error moving ${comp}:`, error.message);
    failed++;
  }
}

console.log(`\n✅ Movidos: ${moved} componentes`);
console.log(`⚠️  No encontrados/Errores: ${failed} componentes`);
console.log(`\n📁 Componentes en cuarentena: src/components/ui/_unused/`);
