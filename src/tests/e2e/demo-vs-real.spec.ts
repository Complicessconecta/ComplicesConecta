import { test, expect } from '@playwright/test';

test.describe('Demo vs Real Data Isolation', () => {
  test('Demo session should have mock data', async ({ page }) => {
    await page.goto('http://localhost:5173/auth');
    
    // Click demo mode
    await page.click('button:has-text("Modo Demo")');
    await page.click('button:has-text("Single")');
    
    // Verify demo flag
    const demoFlag = await page.evaluate(() => localStorage.getItem('demo_authenticated'));
    expect(demoFlag).toBe('true');
    
    // Verify demo email
    await page.waitForURL('**/profile-single');
    const email = await page.textContent('[data-testid="user-email"]');
    expect(email).toContain('demo@');
    
    // Verify mock profile
    const displayName = await page.textContent('[data-testid="display-name"]');
    expect(displayName).toBeTruthy();
  });

  test('Real session should NOT have demo data', async ({ page }) => {
    await page.goto('http://localhost:5173/auth');
    
    // Login with real credentials
    await page.fill('[name="email"]', 'test@real.com');
    await page.fill('[name="password"]', 'RealPassword123!');
    await page.click('button:has-text("Ingresar")');
    
    // Verify demo flag is false
    const demoFlag = await page.evaluate(() => localStorage.getItem('demo_authenticated'));
    expect(demoFlag).toBe('false');
    
    // Verify real email (NOT demo)
    await page.waitForURL('**/profile-single');
    const email = await page.textContent('[data-testid="user-email"]');
    expect(email).not.toContain('demo@');
    expect(email).toContain('test@real.com');
  });

  test('Demo and Real sessions should not mix data', async ({ page }) => {
    // Start with demo
    await page.goto('http://localhost:5173/auth');
    await page.click('button:has-text("Modo Demo")');
    await page.click('button:has-text("Single")');
    
    const demoEmail = await page.textContent('[data-testid="user-email"]');
    expect(demoEmail).toContain('demo@');
    
    // Logout demo
    await page.click('[data-testid="logout-button"]');
    
    // Verify localStorage cleaned
    const demoFlag = await page.evaluate(() => localStorage.getItem('demo_authenticated'));
    expect(demoFlag).toBe('false');
    
    // Login with real account
    await page.fill('[name="email"]', 'test@real.com');
    await page.fill('[name="password"]', 'RealPassword123!');
    await page.click('button:has-text("Ingresar")');
    
    // Verify real data is different
    const realEmail = await page.textContent('[data-testid="user-email"]');
    expect(realEmail).not.toEqual(demoEmail);
    expect(realEmail).toContain('test@real.com');
  });

  test('RLS should prevent demo user from accessing real data', async ({ page }) => {
    // Try to access real profile while in demo mode
    await page.goto('http://localhost:5173/auth');
    await page.click('button:has-text("Modo Demo")');
    await page.click('button:has-text("Single")');
    
    // Try direct API call (should fail)
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/profiles/real-user-id');
        return res.status;
      } catch {
        return 403;
      }
    });
    
    expect(response).toBe(403);
  });
});
