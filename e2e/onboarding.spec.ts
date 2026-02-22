import { test, expect } from '@playwright/test';

/**
 * Testes E2E para o fluxo de onboarding simplificado (3 passos)
 * 
 * Validações:
 * - Fluxo completo de 3 passos (Perfil → Conectar Redes → Pronto)
 * - Não há referências ao HeyGen no onboarding
 * - Navegação entre passos funciona corretamente
 * - Possibilidade de pular passos
 */

test.describe('Onboarding Simplificado', () => {
  test.beforeEach(async ({ page }) => {
    // Simular usuário autenticado que precisa fazer onboarding
    // Em um cenário real, você faria login ou usaria um mock de autenticação
    await page.goto('/onboarding');
  });

  test('deve exibir 3 passos no stepper', async ({ page }) => {
    // Verificar que o stepper tem exatamente 3 passos
    await expect(page.getByText('1. Perfil')).toBeVisible();
    await expect(page.getByText('2. Conectar Redes')).toBeVisible();
    await expect(page.getByText('3. Pronto')).toBeVisible();
    
    // Verificar que NÃO existe passo 4 ou referência a Avatar AI no stepper
    await expect(page.getByText('4.')).not.toBeVisible();
    await expect(page.getByText('Avatar AI')).not.toBeVisible();
  });

  test('deve completar Passo 1 (Perfil) com sucesso', async ({ page }) => {
    // Verificar que está no Passo 1
    await expect(page.getByRole('heading', { name: /Passo 1: Perfil/i })).toBeVisible();
    
    // Preencher nome completo
    const nameInput = page.getByLabel(/nome completo/i);
    await expect(nameInput).toBeVisible();
    await nameInput.fill('João Silva');
    
    // Selecionar público-alvo
    const audienceSelect = page.getByLabel(/público-alvo/i);
    await expect(audienceSelect).toBeVisible();
    await audienceSelect.selectOption('mlm');
    
    // Verificar que há seletor de perfis profissionais
    await expect(page.getByText(/Perfis Profissionais/i)).toBeVisible();
    
    // Clicar em "Salvar e Continuar"
    await page.getByRole('button', { name: /Salvar e Continuar/i }).click();
    
    // Deve avançar para Passo 2
    await expect(page.getByRole('heading', { name: /Passo 2: Conectar Redes Sociais/i })).toBeVisible();
  });

  test('deve permitir pular Passo 1', async ({ page }) => {
    // Verificar que está no Passo 1
    await expect(page.getByRole('heading', { name: /Passo 1: Perfil/i })).toBeVisible();
    
    // Clicar no botão "Pular" (há dois botões Pular no Passo 1)
    const skipButtons = page.getByRole('button', { name: /Pular/i });
    await skipButtons.first().click();
    
    // Deve avançar para Passo 2
    await expect(page.getByRole('heading', { name: /Passo 2: Conectar Redes Sociais/i })).toBeVisible();
  });

  test('deve exibir Passo 2 (Conectar Redes) corretamente', async ({ page }) => {
    // Avançar para Passo 2
    await page.getByRole('button', { name: /Pular/i }).first().click();
    
    // Verificar título e descrição
    await expect(page.getByRole('heading', { name: /Passo 2: Conectar Redes Sociais/i })).toBeVisible();
    await expect(page.getByText(/Conecte as redes sociais onde você quer publicar/i)).toBeVisible();
    
    // Verificar que as plataformas sociais estão visíveis
    // (Os cards de redes sociais devem estar presentes)
    await expect(page.locator('[class*="grid"]').first()).toBeVisible();
    
    // Verificar botões de navegação
    await expect(page.getByRole('button', { name: /← Voltar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pular/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continuar →/i })).toBeVisible();
  });

  test('deve permitir voltar do Passo 2 para Passo 1', async ({ page }) => {
    // Avançar para Passo 2
    await page.getByRole('button', { name: /Pular/i }).first().click();
    await expect(page.getByRole('heading', { name: /Passo 2: Conectar Redes Sociais/i })).toBeVisible();
    
    // Clicar em "Voltar"
    await page.getByRole('button', { name: /← Voltar/i }).click();
    
    // Deve voltar para Passo 1
    await expect(page.getByRole('heading', { name: /Passo 1: Perfil/i })).toBeVisible();
  });

  test('deve permitir pular Passo 2', async ({ page }) => {
    // Avançar para Passo 2
    await page.getByRole('button', { name: /Pular/i }).first().click();
    
    // Pular Passo 2
    await page.getByRole('button', { name: /Pular/i }).click();
    
    // Deve avançar para Passo 3 (Pronto)
    await expect(page.getByRole('heading', { name: /Configuração Completa/i })).toBeVisible();
  });

  test('deve exibir Passo 3 (Pronto) corretamente', async ({ page }) => {
    // Avançar para Passo 3
    await page.getByRole('button', { name: /Pular/i }).first().click(); // Passo 1
    await page.getByRole('button', { name: /Pular/i }).click(); // Passo 2
    
    // Verificar elementos do Passo 3
    await expect(page.getByText('🎉')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Configuração Completa/i })).toBeVisible();
    await expect(page.getByText(/Seu perfil está configurado e pronto para uso/i)).toBeVisible();
    
    // Verificar resumo
    await expect(page.getByText(/Perfis selecionados/i)).toBeVisible();
    await expect(page.getByText(/Redes conectadas/i)).toBeVisible();
    
    // Verificar mensagem sobre Avatar AI
    await expect(page.getByText(/Você pode configurar o Avatar AI \(HeyGen\) depois no módulo AvatarAI/i)).toBeVisible();
    
    // Verificar botões
    await expect(page.getByRole('button', { name: /← Voltar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ir para Dashboard →/i })).toBeVisible();
  });

  test('deve permitir voltar do Passo 3 para Passo 2', async ({ page }) => {
    // Avançar para Passo 3
    await page.getByRole('button', { name: /Pular/i }).first().click(); // Passo 1
    await page.getByRole('button', { name: /Pular/i }).click(); // Passo 2
    
    await expect(page.getByRole('heading', { name: /Configuração Completa/i })).toBeVisible();
    
    // Clicar em "Voltar"
    await page.getByRole('button', { name: /← Voltar/i }).click();
    
    // Deve voltar para Passo 2
    await expect(page.getByRole('heading', { name: /Passo 2: Conectar Redes Sociais/i })).toBeVisible();
  });

  test('deve redirecionar para dashboard ao finalizar', async ({ page }) => {
    // Avançar para Passo 3
    await page.getByRole('button', { name: /Pular/i }).first().click(); // Passo 1
    await page.getByRole('button', { name: /Pular/i }).click(); // Passo 2
    
    // Clicar em "Ir para Dashboard"
    await page.getByRole('button', { name: /Ir para Dashboard →/i }).click();
    
    // Deve redirecionar para dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('NÃO deve ter referências ao HeyGen no onboarding', async ({ page }) => {
    // Verificar Passo 1
    await expect(page.getByText(/heygen/i)).not.toBeVisible();
    await expect(page.getByText(/api key/i)).not.toBeVisible();
    await expect(page.getByText(/avatar id/i)).not.toBeVisible();
    await expect(page.getByText(/voice id/i)).not.toBeVisible();
    
    // Avançar para Passo 2
    await page.getByRole('button', { name: /Pular/i }).first().click();
    await expect(page.getByText(/heygen/i)).not.toBeVisible();
    
    // Avançar para Passo 3
    await page.getByRole('button', { name: /Pular/i }).click();
    
    // No Passo 3, deve haver apenas uma menção informativa sobre configurar depois
    const heygenMentions = await page.getByText(/heygen/i).count();
    expect(heygenMentions).toBeLessThanOrEqual(1); // Apenas a menção informativa
    
    // Não deve haver campos de input para HeyGen
    await expect(page.getByLabel(/api key/i)).not.toBeVisible();
    await expect(page.getByLabel(/avatar id/i)).not.toBeVisible();
    await expect(page.getByLabel(/voice id/i)).not.toBeVisible();
  });

  test('deve completar fluxo completo de onboarding', async ({ page }) => {
    // Passo 1: Preencher perfil
    await page.getByLabel(/nome completo/i).fill('Maria Santos');
    await page.getByLabel(/público-alvo/i).selectOption('marketing');
    await page.getByRole('button', { name: /Salvar e Continuar/i }).click();
    
    // Passo 2: Pular conexão de redes
    await expect(page.getByRole('heading', { name: /Passo 2: Conectar Redes Sociais/i })).toBeVisible();
    await page.getByRole('button', { name: /Continuar →/i }).click();
    
    // Passo 3: Verificar resumo e finalizar
    await expect(page.getByRole('heading', { name: /Configuração Completa/i })).toBeVisible();
    await expect(page.getByText(/Perfis selecionados/i)).toBeVisible();
    await page.getByRole('button', { name: /Ir para Dashboard →/i }).click();
    
    // Verificar redirecionamento
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('deve persistir progresso entre passos', async ({ page }) => {
    // Preencher Passo 1
    await page.getByLabel(/nome completo/i).fill('Pedro Oliveira');
    await page.getByRole('button', { name: /Salvar e Continuar/i }).click();
    
    // Avançar para Passo 2
    await expect(page.getByRole('heading', { name: /Passo 2: Conectar Redes Sociais/i })).toBeVisible();
    
    // Voltar para Passo 1
    await page.getByRole('button', { name: /← Voltar/i }).click();
    
    // Verificar que o nome foi persistido
    const nameInput = page.getByLabel(/nome completo/i);
    await expect(nameInput).toHaveValue('Pedro Oliveira');
  });
});
