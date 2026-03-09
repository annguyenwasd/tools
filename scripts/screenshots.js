import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../docs/screenshots');
const BASE = 'https://xplorertools.netlify.app';
const VIEWPORT = { width: 1280, height: 800 };

async function shot(page, name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(`  ✓ ${name}.png`);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  // Pre-load a prompt mock that we can configure at runtime
  await ctx.addInitScript(() => {
    window.__promptResponse = null;
    const _orig = window.prompt.bind(window);
    window.prompt = (msg) => {
      if (window.__promptResponse !== null) {
        const r = window.__promptResponse;
        window.__promptResponse = null;
        return r;
      }
      return _orig(msg);
    };
  });
  const page = await ctx.newPage();

  // ── 1. Home ───────────────────────────────────────────────────────
  console.log('Home');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await shot(page, '01-home');

  // ── 2. Retro landing ──────────────────────────────────────────────
  console.log('Retro landing');
  await page.goto(`${BASE}/retro`, { waitUntil: 'networkidle' });
  await shot(page, '02-retro-landing');

  // Fill host name
  await page.locator('input').first().fill('Alice');
  await shot(page, '03-retro-create-form');

  // Create retro session
  await page.getByRole('button', { name: 'Create Session' }).click();
  await page.waitForURL(/\/retro\/session\//, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await shot(page, '04-retro-write');

  // Add a card to first category textarea
  const textarea = page.locator('textarea').first();
  if (await textarea.isVisible().catch(() => false)) {
    await textarea.fill('Improved deployment pipeline');
    await textarea.press('Enter');
    await page.waitForTimeout(600);
    await shot(page, '05-retro-write-card');
  }

  // Advance to Vote phase
  console.log('Retro vote');
  await page.locator('button:has-text("Next:")').click();
  await page.waitForTimeout(800);
  await shot(page, '06-retro-vote');

  // Advance to Discuss phase
  console.log('Retro discuss');
  await page.locator('button:has-text("Next:")').click();
  await page.waitForTimeout(800);
  await shot(page, '07-retro-discuss');

  // Advance to Export phase
  console.log('Retro export');
  await page.locator('button:has-text("Next:")').click();
  await page.waitForTimeout(800);
  await shot(page, '08-retro-export');

  // ── 3. Poker landing ──────────────────────────────────────────────
  console.log('Poker landing');
  await page.goto(`${BASE}/poker`, { waitUntil: 'networkidle' });
  await shot(page, '09-poker-landing');

  await page.locator('input').first().fill('Bob');
  await shot(page, '10-poker-create-form');

  // Create poker session
  await page.getByRole('button', { name: 'Create Session' }).click();
  await page.waitForURL(/\/poker\/session\//, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await shot(page, '11-poker-session-empty');

  // Add a story via prompt (mock window.prompt)
  console.log('Poker story');
  await page.evaluate(() => { window.__promptResponse = 'User Authentication redesign'; });
  await page.locator('button:has-text("Add Story")').click();
  await page.waitForTimeout(1000);
  await shot(page, '12-poker-story-added');

  // Select the story (host clicks it in the sidebar)
  const storyItem = page.locator('[role="button"]').filter({ hasText: 'User Authentication' }).first();
  await storyItem.waitFor({ timeout: 5000 }).catch(() => {});
  if (await storyItem.isVisible().catch(() => false)) {
    await storyItem.click();
    await page.waitForTimeout(1000);
    await shot(page, '13-poker-voting');

    // Click voting card "5"
    await page.locator('.MuiPaper-root').filter({ hasText: /^5$/ }).first().click().catch(() => {});
    await page.waitForTimeout(400);
    await shot(page, '14-poker-voted');

    // Reveal votes
    const revealBtn = page.locator('button:has-text("Reveal Votes")');
    if (await revealBtn.isVisible().catch(() => false)) {
      await revealBtn.click();
      await page.waitForTimeout(800);
      await shot(page, '15-poker-revealed');
    }
  }

  // Export dialog
  console.log('Poker export');
  const exportBtn = page.locator('[aria-label="Export estimates"], button[title="Export estimates"]').first();
  if (await exportBtn.isVisible().catch(() => false)) {
    await exportBtn.click();
    await page.waitForTimeout(500);
    await shot(page, '16-poker-export');
  } else {
    // Try tooltip button — DownloadIcon is inside an IconButton
    await page.locator('button svg[data-testid="DownloadIcon"]').click().catch(() => {});
    await page.waitForTimeout(500);
    await shot(page, '16-poker-export');
  }

  await browser.close();
  console.log('\nDone.');
})();
