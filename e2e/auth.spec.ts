import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('deve exibir página de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login/i }).click();
    
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('deve redirecionar para dashboard após login bem-sucedido', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('deve exibir página de registro', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /register/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
  });

  test('deve fazer logout com sucesso', async ({ page }) => {
    // Login primeiro
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Logout
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
