#!/usr/bin/env node
/**
 * record-poker.js
 *
 * Launches a Vite dev server, then uses Playwright to simulate 3 users
 * (Alice, Bob, Carol) playing through a full Planning Poker session.
 * Alice's browser context is recorded and the video saved to:
 *   public/videos/poker-demo.webm
 */

'use strict';

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const VIDEO_DIR = path.join(ROOT, 'public', 'videos');
const OUT_VIDEO = path.join(VIDEO_DIR, 'poker-demo.webm');
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function waitForServer(url, timeoutMs = 60_000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      http.get(url, (res) => {
        res.resume();
        resolve();
      }).on('error', () => {
        if (Date.now() > deadline) return reject(new Error('Dev server timeout'));
        setTimeout(check, 600);
      });
    };
    check();
  });
}

// Click a voting card by exact text value on a given page
async function clickCard(page, value) {
  // Cards are MuiPaper elements containing a Typography h6 with the card value.
  // Use getByText with exact match inside the VotingCards container.
  // The Paper elements have role presentation; locate by the h6 text then click the Paper ancestor.
  const h6 = page.locator('h6').filter({ hasText: new RegExp(`^${value.replace('.', '\\.')}$`) }).first();
  await h6.waitFor({ state: 'visible', timeout: 20_000 });
  // Click the Paper (grandparent of h6 → Typography → Paper)
  await h6.locator('xpath=ancestor::*[contains(@class,"MuiPaper-root")][1]').click();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(async () => {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  // -------------------------------------------------------------------------
  // 1. Start Vite dev server on a clean port
  // -------------------------------------------------------------------------
  console.log('Starting dev server on port', PORT, '…');
  const devServer = spawn('pnpm', ['exec', 'vite', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  devServer.stdout.on('data', (d) => process.stdout.write(`[vite] ${d}`));
  devServer.stderr.on('data', (d) => process.stderr.write(`[vite] ${d}`));

  const killServer = () => {
    try { devServer.kill('SIGTERM'); } catch {}
  };
  process.on('SIGINT', killServer);
  process.on('exit', killServer);

  try {
    await waitForServer(`${BASE_URL}/`);
    console.log('Dev server is ready.');
  } catch (err) {
    killServer();
    throw err;
  }

  // Temporary directory for the video
  const videosDir = fs.mkdtempSync(path.join(os.tmpdir(), 'poker-video-'));

  let browser;
  try {
    browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // -----------------------------------------------------------------------
    // 2. Create three browser contexts (Alice is recorded)
    // -----------------------------------------------------------------------
    const aliceCtx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      recordVideo: { dir: videosDir, size: { width: 1280, height: 800 } },
    });
    const bobCtx   = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const carolCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

    const alice = await aliceCtx.newPage();
    const bob   = await bobCtx.newPage();
    const carol = await carolCtx.newPage();

    // Silence unhandled errors from non-Alice pages
    bob.on('pageerror', () => {});
    carol.on('pageerror', () => {});

    // -----------------------------------------------------------------------
    // 3. Alice opens /poker and creates a session
    // -----------------------------------------------------------------------
    console.log('\n--- Alice: creating session ---');
    await alice.goto(`${BASE_URL}/poker`);
    await alice.waitForLoadState('networkidle');
    await sleep(1200);

    // Type name into the first MUI TextField input on the Create tab
    const aliceNameInput = alice.locator('.MuiCardContent-root .MuiTextField-root').first().locator('input');
    await aliceNameInput.click();
    await aliceNameInput.fill('Alice');
    await sleep(600);

    // Make sure "Modified Fibonacci" chip is selected (it is by default, click to highlight)
    const fibChip = alice.locator('.MuiChip-root').filter({ hasText: 'Modified Fibonacci' });
    await fibChip.click();
    await sleep(500);

    // Click Create Session (submit button, not the tab — use getByRole to be precise)
    await alice.getByRole('button', { name: 'Create Session', exact: true }).click();
    await alice.waitForURL(`${BASE_URL}/poker/session/**`, { timeout: 20_000 });
    await alice.waitForLoadState('networkidle');
    await sleep(1800);

    const sessionId = alice.url().split('/poker/session/')[1];
    console.log('Session ID:', sessionId);

    // -----------------------------------------------------------------------
    // 4. Alice adds two stories via the browser prompt
    // -----------------------------------------------------------------------
    console.log('\n--- Alice: adding stories ---');

    alice.once('dialog', async (dlg) => {
      await sleep(400);
      await dlg.accept('US-001: Login page');
    });
    await alice.locator('button:has-text("Add Story")').click();
    await alice.waitForSelector(':text("US-001: Login page")', { timeout: 12_000 });
    await sleep(1200);

    alice.once('dialog', async (dlg) => {
      await sleep(400);
      await dlg.accept('US-002: Dashboard');
    });
    await alice.locator('button:has-text("Add Story")').click();
    await alice.waitForSelector(':text("US-002: Dashboard")', { timeout: 12_000 });
    await sleep(1500);

    // -----------------------------------------------------------------------
    // 5. Bob joins
    // -----------------------------------------------------------------------
    console.log('\n--- Bob: joining session ---');
    await bob.goto(`${BASE_URL}/poker`);
    await bob.waitForLoadState('networkidle');
    await sleep(800);

    await bob.locator('[role="tab"]').filter({ hasText: 'Join Session' }).click();
    await sleep(500);

    const bobName = bob.locator('.MuiCardContent-root .MuiTextField-root').nth(0).locator('input');
    const bobCode = bob.locator('.MuiCardContent-root .MuiTextField-root').nth(1).locator('input');
    await bobName.fill('Bob');
    await sleep(300);
    await bobCode.fill(sessionId);
    await sleep(500);
    await bob.getByRole('button', { name: 'Join Session', exact: true }).click();
    await bob.waitForURL(`${BASE_URL}/poker/session/**`, { timeout: 15_000 });
    await bob.waitForLoadState('networkidle');
    await sleep(1000);

    // -----------------------------------------------------------------------
    // 6. Carol joins
    // -----------------------------------------------------------------------
    console.log('\n--- Carol: joining session ---');
    await carol.goto(`${BASE_URL}/poker`);
    await carol.waitForLoadState('networkidle');
    await sleep(800);

    await carol.locator('[role="tab"]').filter({ hasText: 'Join Session' }).click();
    await sleep(500);

    const carolName = carol.locator('.MuiCardContent-root .MuiTextField-root').nth(0).locator('input');
    const carolCode = carol.locator('.MuiCardContent-root .MuiTextField-root').nth(1).locator('input');
    await carolName.fill('Carol');
    await sleep(300);
    await carolCode.fill(sessionId);
    await sleep(500);
    await carol.getByRole('button', { name: 'Join Session', exact: true }).click();
    await carol.waitForURL(`${BASE_URL}/poker/session/**`, { timeout: 15_000 });
    await carol.waitForLoadState('networkidle');
    await sleep(1800);

    // Let Alice's screen refresh to show 3 members
    await sleep(1000);

    // -----------------------------------------------------------------------
    // 7. Alice selects story US-001
    // -----------------------------------------------------------------------
    console.log('\n--- Alice: selecting US-001 ---');
    await alice.locator('.MuiListItemButton-root').filter({ hasText: 'US-001' }).first().click();
    await sleep(2200);

    // Wait for voting cards to appear (h6 elements with card values)
    await alice.waitForSelector('h6', { timeout: 15_000 });
    await sleep(800);

    // -----------------------------------------------------------------------
    // 8. US-001 votes: Alice=5, Bob=8, Carol=5
    // -----------------------------------------------------------------------
    console.log('\n--- Voting round 1: US-001 ---');

    await clickCard(alice, '5');
    await sleep(1000);

    // Bob and Carol wait for their pages to sync
    await bob.waitForSelector('h6', { timeout: 20_000 });
    await clickCard(bob, '8');
    await sleep(1000);

    await carol.waitForSelector('h6', { timeout: 20_000 });
    await clickCard(carol, '5');
    await sleep(1800);

    // -----------------------------------------------------------------------
    // 9. Alice reveals votes
    // -----------------------------------------------------------------------
    console.log('\n--- Alice: revealing votes for US-001 ---');
    await alice.waitForSelector('button:has-text("Reveal Votes")', { timeout: 10_000 });
    await sleep(500);
    await alice.locator('button:has-text("Reveal Votes")').click();
    await sleep(2800);

    // -----------------------------------------------------------------------
    // 10. Alice confirms estimate as 5
    // -----------------------------------------------------------------------
    console.log('\n--- Alice: confirming estimate 5 for US-001 ---');
    // ResultPanel has a "Final estimate" text field pre-filled with most-common value
    const us1EstField = alice.locator('.MuiTextField-root').filter({ has: alice.locator('label:has-text("Final estimate")') }).locator('input');
    await us1EstField.click({ clickCount: 3 });
    await us1EstField.fill('5');
    await sleep(600);
    await alice.locator('button:has-text("Confirm Estimate")').click();
    await sleep(2500);

    // -----------------------------------------------------------------------
    // 11. Alice selects story US-002
    // -----------------------------------------------------------------------
    console.log('\n--- Alice: selecting US-002 ---');
    await alice.locator('.MuiListItemButton-root').filter({ hasText: 'US-002' }).first().click();
    await sleep(2200);

    await alice.waitForSelector('h6', { timeout: 15_000 });
    await sleep(800);

    // -----------------------------------------------------------------------
    // 12. US-002 votes: Alice=3, Bob=3, Carol=2
    // -----------------------------------------------------------------------
    console.log('\n--- Voting round 2: US-002 ---');

    await clickCard(alice, '3');
    await sleep(1000);

    await bob.waitForSelector('h6', { timeout: 20_000 });
    await clickCard(bob, '3');
    await sleep(1000);

    await carol.waitForSelector('h6', { timeout: 20_000 });
    await clickCard(carol, '2');
    await sleep(1800);

    // -----------------------------------------------------------------------
    // 13. Alice reveals and confirms estimate as 3
    // -----------------------------------------------------------------------
    console.log('\n--- Alice: revealing votes for US-002 ---');
    await alice.waitForSelector('button:has-text("Reveal Votes")', { timeout: 10_000 });
    await sleep(500);
    await alice.locator('button:has-text("Reveal Votes")').click();
    await sleep(2800);

    console.log('\n--- Alice: confirming estimate 3 for US-002 ---');
    const us2EstField = alice.locator('.MuiTextField-root').filter({ has: alice.locator('label:has-text("Final estimate")') }).locator('input');
    await us2EstField.click({ clickCount: 3 });
    await us2EstField.fill('3');
    await sleep(600);
    await alice.locator('button:has-text("Confirm Estimate")').click();
    await sleep(2500);

    // -----------------------------------------------------------------------
    // 14. Alice opens Export dialog and clicks CSV Download
    // -----------------------------------------------------------------------
    console.log('\n--- Alice: exporting as CSV ---');
    // The export button is a Tooltip wrapping an IconButton with DownloadIcon.
    const exportBtn = alice.locator('button').filter({ has: alice.locator('[data-testid="DownloadIcon"]') }).first();
    await exportBtn.click();
    await sleep(1500);

    await alice.waitForSelector('text=Export Estimates', { timeout: 10_000 });
    await sleep(1200);

    // Trigger download — CSV is always the first Download button in the dialog
    // (order: CSV, Markdown, JSON)
    const [download] = await Promise.all([
      alice.waitForEvent('download'),
      alice.locator('.MuiDialog-root').getByRole('button', { name: 'Download' }).first().click(),
    ]);
    console.log('Downloaded:', download.suggestedFilename());
    await sleep(2000);

    // Close dialog
    await alice.keyboard.press('Escape');
    await sleep(1500);

    // Final linger so the video shows the finished state
    await sleep(2500);

    // -----------------------------------------------------------------------
    // 15. Save the video
    // -----------------------------------------------------------------------
    console.log('\nSaving video…');
    const videoHandle = alice.video();
    const videoPathBeforeClose = await videoHandle?.path();

    await aliceCtx.close();
    await bobCtx.close();
    await carolCtx.close();

    // After context close the video is finalised
    const finalVideoPath = await videoHandle?.path() || videoPathBeforeClose;

    let sourceVideo = null;
    if (finalVideoPath && fs.existsSync(finalVideoPath)) {
      sourceVideo = finalVideoPath;
    } else {
      // Fall back: pick any .webm in the temp dir
      const files = fs.readdirSync(videosDir).filter((f) => f.endsWith('.webm'));
      if (files.length > 0) sourceVideo = path.join(videosDir, files[0]);
    }

    if (sourceVideo) {
      fs.copyFileSync(sourceVideo, OUT_VIDEO);
      const size = (fs.statSync(OUT_VIDEO).size / 1024 / 1024).toFixed(1);
      console.log(`\nVideo saved: ${OUT_VIDEO}  (${size} MB)`);
    } else {
      console.error('Could not find video file in', videosDir);
      process.exit(1);
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    killServer();
    console.log('Dev server stopped.');
  }
})().catch((err) => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
