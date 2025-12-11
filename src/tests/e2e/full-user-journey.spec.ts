/**
 * Full User Journey E2E Test - ComplicesConecta
 * 
 * Test robusto que valida el flujo crítico del negocio:
 * 1. Registro/Login
 * 2. Matching (Descubrir)
 * 3. Staking (Transacción)
 * 4. Simulación de Error
 * 5. Recuperación vía Chatbot
 * 
 * @author QA Automation Engineer
 * @version 1.0.0
 */

import { test, expect, Page } from '@playwright/test';

// 🔧 Configuración de timeouts y retries
const DEFAULT_TIMEOUT = 30000;
const NETWORK_TIMEOUT = 10000;

// 🎯 Selectores principales
const SELECTORS = {
  // Auth
  loginButton: '[data-testid="login-button"]',
  emailInput: '[data-testid="email-input"]',
  passwordInput: '[data-testid="password-input"]',
  submitButton: '[data-testid="submit-button"]',
  
  // Matching
  discoverSection: '[data-testid="discover-section"]',
  matchCard: '[data-testid="match-card"]',
  likeButton: '[data-testid="like-button"]',
  passButton: '[data-testid="pass-button"]',
  
  // Staking
  walletSection: '[data-testid="wallet-section"]',
  stakingButton: '[data-testid="staking-button"]',
  stakingAmountInput: '[data-testid="staking-amount-input"]',
  confirmStakingButton: '[data-testid="confirm-staking-button"]',
  
  // Chatbot
  chatbotButton: '[data-testid="chatbot-button"]',
  chatbotContainer: '[data-testid="chatbot-container"]',
  chatbotInput: '[data-testid="chatbot-input"]',
  chatbotSendButton: '[data-testid="chatbot-send-button"]',
  
  // Error handling
  errorAlert: '[data-testid="error-alert"]',
  helpButton: '[data-testid="help-button"]',
};

// 📊 Test data
const TEST_USER = {
  email: 'test@complicesconecta.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

const STAKING_AMOUNT = 100;

/**
 * PASO 1: Registro/Login
 * Simula un usuario entrando a la plataforma
 */
test.describe('PASO 1: Registro/Login', () => {
  test('Debe permitir login exitoso', async ({ page }) => {
    // Navegar a la página de login
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
    
    // Verificar que la página de login cargó
    await expect(page.locator(SELECTORS.emailInput)).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    
    // Llenar formulario de login
    await page.fill(SELECTORS.emailInput, TEST_USER.email);
    await page.fill(SELECTORS.passwordInput, TEST_USER.password);
    
    // Hacer clic en submit
    await page.click(SELECTORS.submitButton);
    
    // Esperar a que se redirija al dashboard
    await page.waitForURL('**/dashboard', { timeout: DEFAULT_TIMEOUT });
    
    // Verificar que estamos en el dashboard
    expect(page.url()).toContain('/dashboard');
  });
});

/**
 * PASO 2: Matching (Descubrir)
 * Navega a la sección "Descubrir" y valida que carguen las tarjetas
 */
test.describe('PASO 2: Matching (Descubrir)', () => {
  test('Debe cargar tarjetas de matching sin skeletons', async ({ page }) => {
    // Login primero
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
    await page.fill(SELECTORS.emailInput, TEST_USER.email);
    await page.fill(SELECTORS.passwordInput, TEST_USER.password);
    await page.click(SELECTORS.submitButton);
    await page.waitForURL('**/dashboard');
    
    // Navegar a Descubrir
    await page.goto('http://localhost:8080/discover', { waitUntil: 'networkidle' });
    
    // Esperar a que carguen las tarjetas
    await expect(page.locator(SELECTORS.matchCard).first()).toBeVisible({ 
      timeout: DEFAULT_TIMEOUT 
    });
    
    // Verificar que NO hay skeletons (carga completada)
    const skeletons = await page.locator('[data-testid="skeleton-loader"]').count();
    expect(skeletons).toBe(0);
    
    // Verificar que hay al menos una tarjeta
    const cardCount = await page.locator(SELECTORS.matchCard).count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('Debe permitir dar Like a un perfil', async ({ page }) => {
    // Setup: Login y navegar a Descubrir
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
    await page.fill(SELECTORS.emailInput, TEST_USER.email);
    await page.fill(SELECTORS.passwordInput, TEST_USER.password);
    await page.click(SELECTORS.submitButton);
    await page.waitForURL('**/dashboard');
    
    await page.goto('http://localhost:8080/discover', { waitUntil: 'networkidle' });
    await expect(page.locator(SELECTORS.matchCard).first()).toBeVisible();
    
    // Dar Like
    await page.click(SELECTORS.likeButton);
    
    // Verificar feedback visual (animación de Like)
    const likeButton = page.locator(SELECTORS.likeButton).first();
    await expect(likeButton).toHaveClass(/active|liked/);
  });
});

/**
 * PASO 3: Staking (Transacción)
 * Intenta hacer un staking de 100 tokens
 */
test.describe('PASO 3: Staking (Transacción)', () => {
  test('Debe permitir iniciar staking', async ({ page }) => {
    // Setup: Login
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
    await page.fill(SELECTORS.emailInput, TEST_USER.email);
    await page.fill(SELECTORS.passwordInput, TEST_USER.password);
    await page.click(SELECTORS.submitButton);
    await page.waitForURL('**/dashboard');
    
    // Navegar a Wallet
    await page.goto('http://localhost:8080/wallet', { waitUntil: 'networkidle' });
    await expect(page.locator(SELECTORS.walletSection)).toBeVisible();
    
    // Hacer clic en Staking
    await page.click(SELECTORS.stakingButton);
    
    // Llenar cantidad de staking
    await page.fill(SELECTORS.stakingAmountInput, STAKING_AMOUNT.toString());
    
    // Confirmar staking
    await page.click(SELECTORS.confirmStakingButton);
    
    // Esperar confirmación (puede ser modal o redirección)
    await page.waitForTimeout(2000);
    
    // Verificar que se procesó (sin error)
    const errorPresent = await page.locator(SELECTORS.errorAlert).isVisible().catch(() => false);
    expect(errorPresent).toBe(false);
  });
});

/**
 * PASO 4: Simulación de Error
 * Intercepta la petición de staking y fuerza un error 500
 */
test.describe('PASO 4: Simulación de Error', () => {
  test('Debe manejar error de staking (500)', async ({ page }) => {
    // Setup: Login
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
    await page.fill(SELECTORS.emailInput, TEST_USER.email);
    await page.fill(SELECTORS.passwordInput, TEST_USER.password);
    await page.click(SELECTORS.submitButton);
    await page.waitForURL('**/dashboard');
    
    // Interceptar petición de staking y devolver error 500
    await page.route('**/api/staking/**', (route) => {
      route.abort('servererror');
    });
    
    // Navegar a Wallet
    await page.goto('http://localhost:8080/wallet', { waitUntil: 'networkidle' });
    
    // Intentar staking
    await page.click(SELECTORS.stakingButton);
    await page.fill(SELECTORS.stakingAmountInput, STAKING_AMOUNT.toString());
    await page.click(SELECTORS.confirmStakingButton);
    
    // Esperar a que aparezca el error
    await expect(page.locator(SELECTORS.errorAlert)).toBeVisible({ 
      timeout: DEFAULT_TIMEOUT 
    });
    
    // Verificar que el error es visible
    const errorText = await page.locator(SELECTORS.errorAlert).textContent();
    expect(errorText).toBeTruthy();
  });

  test('Debe manejar error de fondos insuficientes', async ({ page }) => {
    // Setup: Login
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
    await page.fill(SELECTORS.emailInput, TEST_USER.email);
    await page.fill(SELECTORS.passwordInput, TEST_USER.password);
    await page.click(SELECTORS.submitButton);
    await page.waitForURL('**/dashboard');
    
    // Interceptar petición de staking y devolver error de fondos
    await page.route('**/api/staking/**', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'InsufficientBalance',
          message: 'Fondos insuficientes para hacer staking'
        })
      });
    });
    
    // Navegar a Wallet
    await page.goto('http://localhost:8080/wallet', { waitUntil: 'networkidle' });
    
    // Intentar staking
    await page.click(SELECTORS.stakingButton);
    await page.fill(SELECTORS.stakingAmountInput, '10000'); // Cantidad muy alta
    await page.click(SELECTORS.confirmStakingButton);
    
    // Esperar a que aparezca el error
    await expect(page.locator(SELECTORS.errorAlert)).toBeVisible();
    
    // Verificar que menciona fondos insuficientes
    const errorText = await page.locator(SELECTORS.errorAlert).textContent();
    expect(errorText?.toLowerCase()).toContain('fondos');
  });
});

/**
 * PASO 5: Recuperación vía Chatbot
 * Valida que el chatbot se abra y proporcione soluciones
 */
test.describe('PASO 5: Recuperación vía Chatbot', () => {
  test('Debe abrir chatbot con solución precargada', async ({ page }) => {
    // Setup: Login y generar error
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
    await page.fill(SELECTORS.emailInput, TEST_USER.email);
    await page.fill(SELECTORS.passwordInput, TEST_USER.password);
    await page.click(SELECTORS.submitButton);
    await page.waitForURL('**/dashboard');
    
    // Interceptar petición de staking para generar error
    await page.route('**/api/staking/**', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'PaymentFailed',
          message: 'El pago fue rechazado'
        })
      });
    });
    
    // Navegar a Wallet e intentar staking
    await page.goto('http://localhost:8080/wallet', { waitUntil: 'networkidle' });
    await page.click(SELECTORS.stakingButton);
    await page.fill(SELECTORS.stakingAmountInput, STAKING_AMOUNT.toString());
    await page.click(SELECTORS.confirmStakingButton);
    
    // Esperar a que aparezca el error
    await expect(page.locator(SELECTORS.errorAlert)).toBeVisible();
    
    // Hacer clic en "Pedir Ayuda"
    await page.click(SELECTORS.helpButton);
    
    // Verificar que el chatbot se abre
    await expect(page.locator(SELECTORS.chatbotContainer)).toBeVisible({ 
      timeout: DEFAULT_TIMEOUT 
    });
  });

  test('Debe recibir respuesta del chatbot con solución', async ({ page }) => {
    // Setup: Login y abrir chatbot
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
    await page.fill(SELECTORS.emailInput, TEST_USER.email);
    await page.fill(SELECTORS.passwordInput, TEST_USER.password);
    await page.click(SELECTORS.submitButton);
    await page.waitForURL('**/dashboard');
    
    // Abrir chatbot
    await page.goto('http://localhost:8080/chat', { waitUntil: 'networkidle' });
    await expect(page.locator(SELECTORS.chatbotContainer)).toBeVisible();
    
    // Enviar pregunta
    const question = '¿Por qué fue rechazado mi pago?';
    await page.fill(SELECTORS.chatbotInput, question);
    await page.click(SELECTORS.chatbotSendButton);
    
    // Esperar respuesta del chatbot
    await page.waitForTimeout(2000); // Esperar procesamiento de IA
    
    // Verificar que hay una respuesta
    const messages = await page.locator('[data-testid="chat-message"]').count();
    expect(messages).toBeGreaterThan(0);
    
    // Verificar que la respuesta contiene información útil
    const lastMessage = await page.locator('[data-testid="chat-message"]').last().textContent();
    expect(lastMessage?.length).toBeGreaterThan(0);
  });
});

/**
 * Test de Flujo Completo (Happy Path)
 * Valida todo el flujo sin errores
 */
test.describe('Flujo Completo (Happy Path)', () => {
  test('Usuario completa todo el flujo sin errores', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
    await page.fill(SELECTORS.emailInput, TEST_USER.email);
    await page.fill(SELECTORS.passwordInput, TEST_USER.password);
    await page.click(SELECTORS.submitButton);
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
    
    // 2. Descubrir y dar Like
    await page.goto('http://localhost:8080/discover', { waitUntil: 'networkidle' });
    await expect(page.locator(SELECTORS.matchCard).first()).toBeVisible();
    await page.click(SELECTORS.likeButton);
    
    // 3. Hacer Staking
    await page.goto('http://localhost:8080/wallet', { waitUntil: 'networkidle' });
    await page.click(SELECTORS.stakingButton);
    await page.fill(SELECTORS.stakingAmountInput, STAKING_AMOUNT.toString());
    await page.click(SELECTORS.confirmStakingButton);
    
    // 4. Verificar que no hay errores
    const errorPresent = await page.locator(SELECTORS.errorAlert).isVisible().catch(() => false);
    expect(errorPresent).toBe(false);
    
    // 5. Verificar que el staking se procesó
    await page.waitForTimeout(2000);
    const successMessage = await page.locator('[data-testid="success-message"]').isVisible().catch(() => false);
    expect(successMessage).toBe(true);
  });
});
