import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Upload de Vídeo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('deve exibir página de upload', async ({ page }) => {
    await page.goto('/videos/upload');
    await expect(page.getByRole('heading', { name: /upload/i })).toBeVisible();
    await expect(page.getByText(/drag.*drop/i)).toBeVisible();
  });

  test('deve validar tipo de arquivo', async ({ page }) => {
    await page.goto('/videos/upload');
    
    // Tentar upload de arquivo não-vídeo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a video'),
    });
    
    await expect(page.getByText(/invalid file type/i)).toBeVisible();
  });

  test('deve mostrar progresso de upload', async ({ page }) => {
    await page.goto('/videos/upload');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content'),
    });
    
    await expect(page.getByRole('progressbar')).toBeVisible();
  });
});
