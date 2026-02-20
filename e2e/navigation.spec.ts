import { test, expect } from '@playwright/test';

test.describe('Navegação', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('deve navegar para página de vídeos', async ({ page }) => {
    await page.getByRole('link', { name: /videos/i }).click();
    await expect(page).toHaveURL(/\/videos/);
    await expect(page.getByRole('heading', { name: /videos/i })).toBeVisible();
  });

  test('deve navegar para página de posts', async ({ page }) => {
    await page.getByRole('link', { name: /posts/i }).click();
    await expect(page).toHaveURL(/\/posts/);
    await expect(page.getByRole('heading', { name: /posts/i })).toBeVisible();
  });

  test('deve navegar para página de analytics', async ({ page }) => {
    await page.getByRole('link', { name: /analytics/i }).click();
    await expect(page).toHaveURL(/\/analytics/);
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
  });

  test('deve navegar para página de configurações', async ({ page }) => {
    await page.getByRole('link', { name: /settings/i }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('deve voltar para dashboard', async ({ page }) => {
    await page.getByRole('link', { name: /videos/i }).click();
    await expect(page).toHaveURL(/\/videos/);
    
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
