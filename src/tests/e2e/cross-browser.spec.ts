/**
 * Tests E2E para compatibilidad multi-navegador
 * Verifica que la aplicaciÃ³n funcione correctamente en diferentes navegadores
 */

import { test, expect, devices } from '@playwright/test';

// ConfiguraciÃ³n de dispositivos y navegadores
const browsers = [
  { name: 'Chrome Desktop', ...devices['Desktop Chrome'] },
  { name: 'Firefox Desktop', ...devices['Desktop Firefox'] },
  { name: 'Safari Desktop', ...devices['Desktop Safari'] },
  { name: 'Chrome Mobile', ...devices['Pixel 5'] },
  { name: 'Safari Mobile', ...devices['iPhone 12'] }
];

// Tests para cada navegador/dispositivo
browsers.forEach(({ name, ...device }) => {
  test.describe(`Compatibilidad ${name}`, () => {
    test.beforeEach(async ({ page }) => {
      // Configurar viewport para cada test
      if (device.viewport) {
        await page.setViewportSize(device.viewport);
      }
    });

    test('deberÃ­a cargar la pÃ¡gina principal correctamente', async ({ page }) => {
      await page.goto('/');
      
      // Verificar que el tÃ­tulo se carga
      await expect(page).toHaveTitle(/ComplicesConecta/);
      
      // Verificar elementos principales
      const mainHeading = page.locator('h1').first();
      await expect(mainHeading).toBeVisible();
      
      // Verificar que no hay errores de JavaScript
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      
      await page.waitForTimeout(2000);
      expect(errors).toHaveLength(0);
    });

    test('deberÃ­a manejar CSS Grid y Flexbox correctamente', async ({ page }) => {
      await page.goto('/profiles');
      
      // Verificar que el grid de perfiles se renderiza
      const profileGrid = page.locator('[class*="grid"]').first();
      await expect(profileGrid).toBeVisible();
      
      // Verificar que los elementos flex funcionan
      const flexElements = page.locator('[class*="flex"]').first();
      await expect(flexElements).toBeVisible();
      
      // Verificar responsive design
      const viewport = page.viewportSize();
      if (viewport && viewport.width < 768) {
        // En mÃ³vil deberÃ­a ser una columna
        const gridCols = await profileGrid.evaluate(el => 
          window.getComputedStyle(el).gridTemplateColumns
        );
        expect(gridCols).toContain('1fr');
      }
    });

    test('deberÃ­a soportar caracterÃ­sticas CSS modernas', async ({ page }) => {
      await page.goto('/');
      
      // Verificar backdrop-filter
      const blurElements = page.locator('[class*="backdrop-blur"]').first();
      if (await blurElements.count() > 0) {
        const backdropFilter = await blurElements.evaluate(el => 
          window.getComputedStyle(el).backdropFilter
        );
        expect(backdropFilter).not.toBe('none');
      }
      
      // Verificar gradientes
      const gradientElements = page.locator('[class*="gradient"]').first();
      if (await gradientElements.count() > 0) {
        const background = await gradientElements.evaluate(el => 
          window.getComputedStyle(el).background
        );
        expect(background).toContain('gradient');
      }
    });

    test('deberÃ­a funcionar la navegaciÃ³n tÃ¡ctil en mÃ³viles', async ({ page }) => {
      if (device.isMobile) {
        await page.goto('/');
        
        // Simular toque en navegaciÃ³n
        const navButton = page.locator('button, a').first();
        await navButton.tap();
        
        // Verificar que la navegaciÃ³n responde
        await page.waitForTimeout(500);
        const currentUrl = page.url();
        expect(currentUrl).toBeTruthy();
      }
    });

    test('deberÃ­a manejar eventos de JavaScript correctamente', async ({ page }) => {
      await page.goto('/profiles');
      
      // Verificar que los event listeners funcionan
      const searchInput = page.locator('input[placeholder*="Busca"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await searchInput.press('Enter');
        
        // Verificar que no hay errores
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.waitForTimeout(1000);
        expect(errors).toHaveLength(0);
      }
    });

    test('deberÃ­a cargar fuentes web correctamente', async ({ page }) => {
      await page.goto('/');
      
      // Verificar que las fuentes se cargan
      const fontLoaded = await page.evaluate(() => {
        return document.fonts.ready.then(() => {
          const fonts = Array.from(document.fonts);
          return fonts.length > 0;
        });
      });
      
      expect(fontLoaded).toBeTruthy();
    });

    test('deberÃ­a soportar animaciones CSS', async ({ page }) => {
      await page.goto('/');
      
      // Verificar elementos animados
      const animatedElements = page.locator('[class*="animate-"]');
      if (await animatedElements.count() > 0) {
        const firstAnimated = animatedElements.first();
        const animation = await firstAnimated.evaluate(el => 
          window.getComputedStyle(el).animation
        );
        expect(animation).not.toBe('none');
      }
    });

    test('deberÃ­a manejar media queries responsive', async ({ page }) => {
      await page.goto('/');
      
      const viewport = page.viewportSize();
      if (viewport) {
        // Verificar clases responsive
        const body = page.locator('body');
        const _classes = await body.getAttribute('class') || '';
        
        if (viewport.width < 640) {
          // MÃ³vil - verificar que no hay overflow horizontal
          const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
          const clientWidth = await page.evaluate(() => document.body.clientWidth);
          expect(scrollWidth).toBeLessThanOrEqual(clientWidth * 1.1);
        }
      }
    });

    test('deberÃ­a funcionar localStorage y sessionStorage', async ({ page }) => {
      await page.goto('/');
      
      // Verificar que localStorage funciona
      const localStorageWorks = await page.evaluate(() => {
        try {
          localStorage.setItem('test', 'value');
          const value = localStorage.getItem('test');
          localStorage.removeItem('test');
          return value === 'value';
        } catch {
          return false;
        }
      });
      
      expect(localStorageWorks).toBeTruthy();
      
      // Verificar que sessionStorage funciona
      const sessionStorageWorks = await page.evaluate(() => {
        try {
          sessionStorage.setItem('test', 'value');
          const value = sessionStorage.getItem('test');
          sessionStorage.removeItem('test');
          return value === 'value';
        } catch {
          return false;
        }
      });
      
      expect(sessionStorageWorks).toBeTruthy();
    });

    test('deberÃ­a soportar APIs modernas del navegador', async ({ page }) => {
      await page.goto('/');
      
      // Verificar Intersection Observer
      const intersectionObserverSupported = await page.evaluate(() => {
        return 'IntersectionObserver' in window;
      });
      expect(intersectionObserverSupported).toBeTruthy();
      
      // Verificar Fetch API
      const fetchSupported = await page.evaluate(() => {
        return 'fetch' in window;
      });
      expect(fetchSupported).toBeTruthy();
      
      // Verificar Promise
      const promiseSupported = await page.evaluate(() => {
        return 'Promise' in window;
      });
      expect(promiseSupported).toBeTruthy();
    });

    test('deberÃ­a manejar errores de red graciosamente', async ({ page }) => {
      // Simular conexiÃ³n lenta
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100);
      });
      
      await page.goto('/');
      
      // Verificar que la pÃ¡gina se carga eventualmente
      const mainContent = page.locator('main, [role="main"]').first();
      await expect(mainContent).toBeVisible({ timeout: 10000 });
    });

    test('deberÃ­a funcionar con diferentes resoluciones de pantalla', async ({ page }) => {
      const resolutions = [
        { width: 1920, height: 1080 }, // Full HD
        { width: 1366, height: 768 },  // Laptop comÃºn
        { width: 375, height: 667 },   // iPhone SE
        { width: 414, height: 896 }    // iPhone XR
      ];

      for (const resolution of resolutions) {
        await page.setViewportSize(resolution);
        await page.goto('/');
        
        // Verificar que el contenido es visible
        const mainContent = page.locator('main, body').first();
        await expect(mainContent).toBeVisible();
        
        // Verificar que no hay scroll horizontal en mÃ³vil
        if (resolution.width <= 414) {
          const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
          expect(scrollWidth).toBeLessThanOrEqual(resolution.width * 1.1);
        }
      }
    });

    test('deberÃ­a soportar modo oscuro/claro del sistema', async ({ page }) => {
      // Probar modo oscuro
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('/');
      
      const isDarkMode = await page.evaluate(() => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      });
      expect(isDarkMode).toBeTruthy();
      
      // Probar modo claro
      await page.emulateMedia({ colorScheme: 'light' });
      await page.reload();
      
      const isLightMode = await page.evaluate(() => {
        return window.matchMedia('(prefers-color-scheme: light)').matches;
      });
      expect(isLightMode).toBeTruthy();
    });

    test('deberÃ­a funcionar con diferentes configuraciones de accesibilidad', async ({ page }) => {
      // Probar con movimiento reducido
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      
      const reducedMotion = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });
      expect(reducedMotion).toBeTruthy();
      
      // Verificar que las animaciones estÃ¡n reducidas
      const animatedElements = page.locator('[class*="animate-"]');
      if (await animatedElements.count() > 0) {
        const animationDuration = await animatedElements.first().evaluate(el => {
          return window.getComputedStyle(el).animationDuration;
        });
        expect(['0s', '0.01s']).toContain(animationDuration);
      }
    });
  });
});

// Test especÃ­fico para verificar compatibilidad de caracterÃ­sticas
test.describe('VerificaciÃ³n de caracterÃ­sticas del navegador', () => {
  test('deberÃ­a detectar caracterÃ­sticas soportadas', async ({ page }) => {
    await page.goto('/');
    
    const features = await page.evaluate(() => {
      return {
        webgl: !!window.WebGLRenderingContext,
        webgl2: !!window.WebGL2RenderingContext,
        webp: (() => {
          const canvas = document.createElement('canvas');
          return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        })(),
        flexbox: CSS.supports('display', 'flex'),
        grid: CSS.supports('display', 'grid'),
        customProperties: CSS.supports('--custom', 'property'),
        backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
        clipPath: CSS.supports('clip-path', 'circle(50%)'),
        objectFit: CSS.supports('object-fit', 'cover')
      };
    });
    
    // Verificar caracterÃ­sticas crÃ­ticas
    expect(features.flexbox).toBeTruthy();
    expect(features.customProperties).toBeTruthy();
    
    // Log caracterÃ­sticas opcionales para debugging
    console.log('CaracterÃ­sticas del navegador:', features);
  });
});

