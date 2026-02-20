import { test, expect } from '@playwright/test';

test.describe('Criação de Post', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('deve exibir formulário de criação de post', async ({ page }) => {
    await page.goto('/posts/new');
    await expect(page.getByRole('heading', { name: /create post/i })).toBeVisible();
    await expect(page.getByLabel(/content/i)).toBeVisible();
    await expect(page.getByLabel(/platform/i)).toBeVisible();
  });

  test('deve validar conteúdo obrigatório', async ({ page }) => {
    await page.goto('/posts/new');
    
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.getByText(/content is required/i)).toBeVisible();
  });

  test('deve criar post com sucesso', async ({ page }) => {
    await page.goto('/posts/new');
    
    await page.getByLabel(/content/i).fill('Test post content');
    await page.getByLabel(/platform/i).selectOption('instagram');
    await page.getByRole('button', { name: /create/i }).click();
    
    await expect(page.getByText(/post created successfully/i)).toBeVisible();
    await expect(page).toHaveURL(/\/posts/);
  });

  test('deve permitir agendar post', async ({ page }) => {
    await page.goto('/posts/new');
    
    await page.getByLabel(/content/i).fill('Scheduled post');
    await page.getByLabel(/platform/i).selectOption('facebook');
    await page.getByLabel(/schedule/i).check();
    await page.getByLabel(/date/i).fill('2024-12-31');
    await page.getByLabel(/time/i).fill('10:00');
    
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.getByText(/post scheduled/i)).toBeVisible();
  });
});
