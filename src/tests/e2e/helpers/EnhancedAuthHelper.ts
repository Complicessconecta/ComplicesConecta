import { Page, BrowserContext } from '@playwright/test';

/**
 * Helper avanzado para autenticaciÃ³n E2E con setup/teardown completo
 */
export class EnhancedAuthHelper {
  private page: Page;
  private context: BrowserContext;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
  }

  /**
   * ConfiguraciÃ³n inicial del helper
   */
  async setup(): Promise<void> {
    console.log('🔧 EnhancedAuthHelper: Iniciando setup...');
    
    // Limpiar estado completo
    await this.clearAllState();
    
    // Configurar mocks de autenticaciÃ³n
    await this.setupAuthMocks();
    
    // Configurar interceptores de red
    await this.setupNetworkInterceptors();
    
    console.log('âœ… EnhancedAuthHelper: Setup completado');
  }

  /**
   * Limpieza final del helper
   */
  async teardown(): Promise<void> {
    console.log('ðŸ§¹ EnhancedAuthHelper: Iniciando teardown...');
    
    try {
      // Solo limpiar si la pÃ¡gina no estÃ¡ cerrada
      if (!this.page.isClosed()) {
        await this.clearAuthState();
      } else {
        console.log('ðŸ§¹ PÃ¡gina cerrada, saltando limpieza completa');
      }
    } catch (error) {
      console.warn('âš ï¸ Error en teardown:', error);
    }
    
    console.log('âœ… EnhancedAuthHelper: Teardown completado');
  }

  /**
   * Login mock para usuario single
   */
  async loginAsSingle(): Promise<void> {
    console.log('ðŸ‘¤ Iniciando login como Single...');
    
    // Usar addInitScript para evitar SecurityError
    await this.context.addInitScript(() => {
      // Mock de usuario single
      const mockUser = {
        id: 'single-test-user-001',
        email: 'single@test.com',
        profile: {
          id: 'single-profile-001',
          name: 'Usuario Single Test',
          type: 'single',
          age: 25,
          location: 'Test City',
          verified: true
        },
        session: {
          access_token: 'mock-single-token',
          refresh_token: 'mock-single-refresh',
          expires_at: Date.now() + 3600000 // 1 hora
        }
      };
      
      try {
        localStorage.setItem('supabase.auth.token', JSON.stringify(mockUser.session));
        localStorage.setItem('user-profile', JSON.stringify(mockUser.profile));
        localStorage.setItem('auth-mode', 'demo');
      } catch (e) {
        console.warn('Login single warning:', e);
      }
    });
    
    // Navegar directamente al dashboard despuÃ©s de configurar localStorage
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('domcontentloaded');
    
    // Esperar a que el Dashboard se renderice
    await this.page.waitForTimeout(3000);
    
    // Verificar si el Dashboard se renderizÃ³ correctamente
    const dashboardTitle = await this.page.locator('h1').textContent();
    if (!dashboardTitle || dashboardTitle.trim() === '') {
      console.warn('âš ï¸ Dashboard no se renderizÃ³, intentando recarga...');
      await this.page.reload();
      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForTimeout(2000);
    }
    
    console.log('âœ… Login Single completado');
  }

  /**
   * Login mock para usuario couple
   */
  async loginAsCouple(): Promise<void> {
    console.log('ðŸ‘« Iniciando login como Couple...');
    
    await this.context.addInitScript(() => {
      // Mock de usuario couple
      const mockUser = {
        id: 'couple-test-user-001',
        email: 'couple@test.com',
        profile: {
          id: 'couple-profile-001',
          name: 'Usuario Couple Test',
          type: 'couple',
          age: 28,
          location: 'Test City',
          verified: true,
          partner: {
            name: 'Partner Test',
            age: 26
          }
        },
        session: {
          access_token: 'mock-couple-token',
          refresh_token: 'mock-couple-refresh',
          expires_at: Date.now() + 3600000
        }
      };
      
      try {
        localStorage.setItem('supabase.auth.token', JSON.stringify(mockUser.session));
        localStorage.setItem('user-profile', JSON.stringify(mockUser.profile));
        localStorage.setItem('auth-mode', 'demo');
      } catch (e) {
        console.warn('Login couple warning:', e);
      }
    });
    
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
    
    // Forzar recarga para que React detecte los cambios en localStorage
    await this.page.reload();
    await this.page.waitForLoadState('domcontentloaded');
    
    console.log('âœ… Login Couple completado');
  }

  /**
   * Login mock para usuario admin
   */
  async loginAsAdmin(): Promise<void> {
    console.log('ðŸ‘‘ Iniciando login como Admin...');
    
    await this.context.addInitScript(() => {
      // Mock de usuario admin
      const mockUser = {
        id: 'admin-test-user-001',
        email: 'admin@test.com',
        profile: {
          id: 'admin-profile-001',
          name: 'Usuario Admin Test',
          type: 'admin',
          age: 30,
          location: 'Test City',
          verified: true,
          permissions: ['admin', 'moderator', 'user']
        },
        session: {
          access_token: 'mock-admin-token',
          refresh_token: 'mock-admin-refresh',
          expires_at: Date.now() + 3600000
        }
      };
      
      try {
        localStorage.setItem('supabase.auth.token', JSON.stringify(mockUser.session));
        localStorage.setItem('user-profile', JSON.stringify(mockUser.profile));
        localStorage.setItem('auth-mode', 'demo');
      } catch (e) {
        console.warn('Login admin warning:', e);
      }
    });
    
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
    
    // Forzar recarga para que React detecte los cambios en localStorage
    await this.page.reload();
    await this.page.waitForLoadState('domcontentloaded');
    
    console.log('âœ… Login Admin completado');
  }

  /**
   * Logout completo
   */
  async logout(): Promise<void> {
    console.log('ðŸšª Ejecutando logout...');
    
    await this.clearAuthState();
    
    // Navegar a pÃ¡gina de login si es necesario
    if (this.page.url().includes('/dashboard') || this.page.url().includes('/profile')) {
      await this.page.goto('/auth');
    }
    
    console.log('âœ… Logout completado');
  }

  /**
   * Verificar si el usuario estÃ¡ autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Usar el storage state de Playwright en lugar de page.evaluate
      const storageState = await this.context.storageState();
      const origins = storageState.origins || [];
      
      for (const origin of origins) {
        const localStorage = origin.localStorage || [];
        const hasProfile = localStorage.some(item => item.name === 'user-profile');
        if (hasProfile) return true;
      }
      
      return false;
    } catch (error) {
      console.warn('âš ï¸ Error verificando autenticaciÃ³n:', error);
      return false;
    }
  }

  /**
   * Obtener perfil del usuario actual
   */
  async getCurrentProfile(): Promise<any> {
    try {
      const storageState = await this.context.storageState();
      const origins = storageState.origins || [];
      
      for (const origin of origins) {
        const localStorage = origin.localStorage || [];
        const profileItem = localStorage.find(item => item.name === 'user-profile');
        if (profileItem) {
          return JSON.parse(profileItem.value);
        }
      }
      
      return null;
    } catch (error) {
      console.warn('âš ï¸ Error obteniendo perfil:', error);
      return null;
    }
  }

  /**
   * Limpiar todo el estado de storage
   */
  private async clearAllState(): Promise<void> {
    try {
      // Verificar si el contexto sigue activo
      if (this.page.isClosed()) {
        console.log('ðŸ§¹ PÃ¡gina ya cerrada, saltando limpieza');
        return;
      }

      // Limpiar usando mÃ©todos nativos de Playwright sin navegaciÃ³n
      await this.context.clearCookies();
      
      // Limpiar storage usando addInitScript para evitar SecurityError
      await this.context.addInitScript(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.warn('Storage clear warning:', e);
        }
      });

      console.log('ðŸ§¹ Estado completo limpiado');
    } catch (error) {
      console.warn('âš ï¸ Error limpiando estado:', error);
    }
  }

  /**
   * Limpiar solo estado de autenticaciÃ³n
   */
  private async clearAuthState(): Promise<void> {
    try {
      // Verificar si el contexto sigue activo
      if (this.page.isClosed()) {
        console.log('ðŸ§¹ PÃ¡gina ya cerrada, saltando limpieza de auth');
        return;
      }

      // Usar addInitScript para evitar SecurityError sin navegaciÃ³n
      await this.context.addInitScript(() => {
        try {
          const authKeys = [
            'supabase.auth.token',
            'user-profile',
            'auth-mode',
            'admin-session',
            'demo-user',
            'session-data'
          ];
          
          authKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
        } catch (e) {
          console.warn('Auth state clear warning:', e);
        }
      });

      console.log('ðŸ§¹ Estado de autenticaciÃ³n limpiado');
    } catch (error) {
      console.warn('âš ï¸ Error limpiando estado de auth:', error);
    }
  }

  /**
   * Configurar mocks de autenticaciÃ³n
   */
  private async setupAuthMocks(): Promise<void> {
    await this.page.addInitScript(() => {
      // Mock de Supabase client
      (window as any).mockSupabaseAuth = {
        signIn: () => Promise.resolve({ data: { user: null }, error: null }),
        signUp: () => Promise.resolve({ data: { user: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null })
      };
      
      // Marcar como entorno de test
      (window as any).isTestEnvironment = true;
    });
  }

  /**
   * Configurar interceptores de red
   */
  private async setupNetworkInterceptors(): Promise<void> {
    // Interceptar llamadas a Supabase
    await this.page.route('**/auth/v1/**', async route => {
      const url = route.request().url();
      
      if (url.includes('/token')) {
        // Mock de respuesta de token
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expires_in: 3600,
            user: { id: 'mock-user-id' }
          })
        });
      } else {
        // Continuar con la peticiÃ³n normal
        await route.continue();
      }
    });
    
    // Interceptar llamadas a API
    await this.page.route('**/rest/v1/**', async route => {
      // Mock de respuestas de API segÃºn sea necesario
      await route.continue();
    });
  }
}

