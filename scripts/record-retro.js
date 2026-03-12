/**
 * record-retro.js
 *
 * Records a Playwright video of a full /retro session with 3 simulated users:
 *   Alice (host) — creates session, writes cards, advances phases, exports JSON
 *   Bob          — joins, writes a card, votes
 *   Carol        — joins, writes a card, votes
 *
 * The video is saved from Alice's context (POV) to:
 *   /Users/annguyenvanchuc/workspace/tools/public/videos/retro-demo.webm
 *
 * Prerequisites:
 *   - Dev server running on http://localhost:5173
 *   - Firebase emulator running on 127.0.0.1:9000
 *   - `pnpm exec playwright install chromium` has been run
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const VIDEO_DIR = path.join(ROOT, 'public', 'videos');
const OUT_VIDEO = path.join(VIDEO_DIR, 'retro-demo.webm');
const BASE = 'http://localhost:5173';
const VIEWPORT = { width: 1440, height: 900 };

// ── helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Wait for an element to appear and be visible, then return it. */
async function waitFor(page, selector, timeout = 15000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  return page.locator(selector).first();
}

/** Spawn a process and return handle + a promise that resolves when it's ready. */
function spawnReady(cmd, args, opts, readyString) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { ...opts, stdio: ['ignore', 'pipe', 'pipe'] });
    let buf = '';
    const onData = (chunk) => {
      buf += chunk.toString();
      if (buf.includes(readyString)) {
        resolve(proc);
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code !== 0 && code !== null) reject(new Error(`Process exited with code ${code}`));
    });
  });
}

/** Check if a TCP port is accepting connections. */
async function portOpen(port, host = '127.0.0.1') {
  const net = await import('net');
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(1000);
    sock.on('connect', () => { sock.destroy(); resolve(true); });
    sock.on('error', () => resolve(false));
    sock.on('timeout', () => resolve(false));
    sock.connect(port, host);
  });
}

async function waitForPort(port, host = '127.0.0.1', attempts = 30, delay = 1000) {
  for (let i = 0; i < attempts; i++) {
    if (await portOpen(port, host)) return;
    await sleep(delay);
  }
  throw new Error(`Port ${port} on ${host} never became available`);
}

// ── main ─────────────────────────────────────────────────────────────────────

(async () => {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  // ── 1. Start Firebase emulator ──────────────────────────────────────────────
  let emulatorProc = null;
  const emulatorAlreadyUp = await portOpen(9000);
  if (!emulatorAlreadyUp) {
    console.log('[setup] Starting Firebase emulator…');
    emulatorProc = spawn(
      'npx', ['firebase', 'emulators:start', '--only', 'database', '--project', 'demo-tools'],
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }
    );
    emulatorProc.stdout.pipe(process.stdout);
    emulatorProc.stderr.pipe(process.stderr);
    await waitForPort(9000, '127.0.0.1', 40, 1500);
    console.log('[setup] Firebase emulator ready.');
  } else {
    console.log('[setup] Firebase emulator already running on :9000');
  }

  // ── 2. Start Vite dev server ────────────────────────────────────────────────
  let devProc = null;
  const devAlreadyUp = await portOpen(5173);
  if (!devAlreadyUp) {
    console.log('[setup] Starting Vite dev server…');
    devProc = spawnReady(
      'pnpm', ['run', 'dev', '--', '--port', '5173'],
      { cwd: ROOT },
      'Local:'
    );
    devProc = await devProc;
    await waitForPort(5173, '127.0.0.1', 30, 1000);
    await sleep(1500); // let HMR settle
    console.log('[setup] Vite dev server ready.');
  } else {
    console.log('[setup] Vite dev server already running on :5173');
  }

  // ── 3. Launch browsers ─────────────────────────────────────────────────────
  const browser = await chromium.launch({ headless: true });

  // Alice's context records the demo video
  const aliceCtx = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: VIDEO_DIR, size: VIEWPORT },
  });
  const bobCtx = await browser.newContext({ viewport: VIEWPORT });
  const carolCtx = await browser.newContext({ viewport: VIEWPORT });

  // Suppress window.prompt in all contexts (safety net)
  for (const ctx of [aliceCtx, bobCtx, carolCtx]) {
    await ctx.addInitScript(() => {
      window.prompt = () => null;
    });
  }

  const alice = await aliceCtx.newPage();
  const bob = await bobCtx.newPage();
  const carol = await carolCtx.newPage();

  let sessionId = null;

  try {
    // ── 4. Alice creates a session ──────────────────────────────────────────
    console.log('[alice] Creating session…');
    await alice.goto(`${BASE}/retro`, { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    // Fill host name
    await alice.locator('input[type="text"]').first().fill('Alice');
    await sleep(600);

    // The first preset "Start / Stop / Continue" is selected by default — no need to click it.
    // Confirm it's selected (it renders as a filled chip with text matching)
    const presetChip = alice.locator('.MuiChip-root').filter({ hasText: 'Start / Stop / Continue' });
    if (await presetChip.isVisible().catch(() => false)) {
      console.log('[alice] Preset "Start / Stop / Continue" already selected.');
    }
    await sleep(500);

    // Click Create Session
    await alice.getByRole('button', { name: 'Create Session' }).click();
    await alice.waitForURL(/\/retro\/session\//, { timeout: 15000 });
    await sleep(1500);

    // Extract session ID from the URL
    sessionId = alice.url().split('/retro/session/')[1];
    console.log(`[alice] Session created: ${sessionId}`);

    // ── 5. Bob joins ────────────────────────────────────────────────────────
    console.log('[bob] Joining session…');
    await bob.goto(`${BASE}/retro`, { waitUntil: 'domcontentloaded' });
    await sleep(800);

    // Switch to Join tab
    await bob.getByRole('tab', { name: 'Join Session' }).click();
    await sleep(400);

    await bob.locator('input').nth(0).fill('Bob');
    await sleep(300);
    await bob.locator('input').nth(1).fill(sessionId);
    await sleep(300);
    await bob.getByRole('button', { name: 'Join Session' }).click();
    await bob.waitForURL(/\/retro\/session\//, { timeout: 15000 });
    await sleep(1000);
    console.log('[bob] Joined.');

    // ── 6. Carol joins ──────────────────────────────────────────────────────
    console.log('[carol] Joining session…');
    await carol.goto(`${BASE}/retro`, { waitUntil: 'domcontentloaded' });
    await sleep(800);

    await carol.getByRole('tab', { name: 'Join Session' }).click();
    await sleep(400);

    await carol.locator('input').nth(0).fill('Carol');
    await sleep(300);
    await carol.locator('input').nth(1).fill(sessionId);
    await sleep(300);
    await carol.getByRole('button', { name: 'Join Session' }).click();
    await carol.waitForURL(/\/retro\/session\//, { timeout: 15000 });
    await sleep(1000);
    console.log('[carol] Joined.');

    // Back to Alice's POV — wait for member list to show all 3
    await alice.bringToFront();
    await sleep(1500);
    console.log('[alice] All 3 members online.');

    // ── 7. Write phase — Alice adds cards ──────────────────────────────────
    console.log('[alice] Writing cards…');

    // Alice writes a "Start" card
    // Each category column has a textarea + an add button (IconButton with AddIcon).
    // The textarea's onKeyDown fires addCard on Enter — use that instead of clicking the icon.
    // Categories: Start (index 0), Stop (index 1), Continue (index 2)
    const aliceTextareas = alice.locator('textarea[placeholder="Add a card\u2026"]');

    // Start card — press Enter to submit
    await aliceTextareas.nth(0).fill('Daily async standups');
    await sleep(400);
    await aliceTextareas.nth(0).press('Enter');
    await sleep(800);

    // Stop card
    await aliceTextareas.nth(1).fill('Long unstructured meetings');
    await sleep(400);
    await aliceTextareas.nth(1).press('Enter');
    await sleep(800);

    // ── 8. Bob writes a card ───────────────────────────────────────────────
    console.log('[bob] Writing a card…');
    const bobTextareas = bob.locator('textarea[placeholder="Add a card\u2026"]');

    // Continue card
    await bobTextareas.nth(2).fill('Weekly code reviews');
    await sleep(400);
    await bobTextareas.nth(2).press('Enter');
    await sleep(800);

    // ── 9. Carol writes a card ────────────────────────────────────────────
    console.log('[carol] Writing a card…');
    const carolTextareas = carol.locator('textarea[placeholder="Add a card\u2026"]');

    // Start card
    await carolTextareas.nth(0).fill('Pair programming sessions');
    await sleep(400);
    await carolTextareas.nth(0).press('Enter');
    await sleep(1000);

    // Switch back to Alice's view to see the cards appear
    await alice.bringToFront();
    await sleep(1500);
    console.log('[alice] All cards written.');

    // ── 10. Alice advances to Vote phase ──────────────────────────────────
    console.log('[alice] Advancing to Vote phase…');
    await alice.locator('button:has-text("Next:")').click();
    await sleep(1500);
    console.log('[alice] Vote phase active.');

    // ── 11. All users vote ────────────────────────────────────────────────
    // Alice votes on cards visible in her context.
    // The vote buttons are IconButtons that wrap HowToVoteIcon. They are not disabled
    // when the user still has remaining votes. Select them via their SVG path data-testid.
    console.log('[alice] Voting…');
    // Wait for vote phase cards to render
    await alice.waitForSelector('.MuiGrid-container', { timeout: 8000 });
    // Enabled vote buttons = not disabled IconButtons inside the vote grid
    const aliceVoteBtns = alice.locator('button:not([disabled])').filter({ has: alice.locator('[data-testid="HowToVoteIcon"]') });
    const aliceVoteCount = await aliceVoteBtns.count();
    console.log(`[alice] Found ${aliceVoteCount} enabled vote buttons`);
    if (aliceVoteCount > 0) {
      await aliceVoteBtns.nth(0).click();
      await sleep(600);
    }
    if (aliceVoteCount > 1) {
      await aliceVoteBtns.nth(1).click();
      await sleep(600);
    }

    // Bob votes — wait for his page to update to vote phase
    console.log('[bob] Voting…');
    await bob.waitForSelector('.MuiGrid-container', { timeout: 8000 });
    const bobVoteBtns = bob.locator('button:not([disabled])').filter({ has: bob.locator('[data-testid="HowToVoteIcon"]') });
    const bobVoteCount = await bobVoteBtns.count();
    console.log(`[bob] Found ${bobVoteCount} enabled vote buttons`);
    if (bobVoteCount > 0) {
      await bobVoteBtns.nth(0).click();
      await sleep(600);
    }

    // Carol votes
    console.log('[carol] Voting…');
    await carol.waitForSelector('.MuiGrid-container', { timeout: 8000 });
    const carolVoteBtns = carol.locator('button:not([disabled])').filter({ has: carol.locator('[data-testid="HowToVoteIcon"]') });
    const carolVoteCount = await carolVoteBtns.count();
    console.log(`[carol] Found ${carolVoteCount} enabled vote buttons`);
    if (carolVoteCount > 0) {
      await carolVoteBtns.nth(0).click();
      await sleep(600);
    }

    // Return to Alice's POV
    await alice.bringToFront();
    await sleep(1500);

    // ── 12. Alice advances to Discuss phase ───────────────────────────────
    console.log('[alice] Advancing to Discuss phase…');
    await alice.locator('button:has-text("Next:")').click();
    await sleep(1500);
    console.log('[alice] Discuss phase active.');

    // Pause a moment to show the discuss view
    await sleep(2000);

    // ── 13. Alice advances to Export phase ────────────────────────────────
    console.log('[alice] Advancing to Export phase…');
    await alice.locator('button:has-text("Next:")').click();
    await sleep(1500);
    console.log('[alice] Export phase active.');

    // Show export options, then click Download JSON
    await sleep(1000);

    // Set up a download promise before triggering the click
    const downloadPromise = alice.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    await alice.getByRole('button', { name: 'Download JSON' }).click();
    const download = await downloadPromise;
    if (download) {
      console.log(`[alice] JSON downloaded: ${download.suggestedFilename()}`);
    }
    await sleep(2000);

    console.log('[alice] Full flow complete!');
  } catch (err) {
    console.error('[error]', err);
  }

  // ── 14. Save video ─────────────────────────────────────────────────────────
  // Closing the page finalises the webm
  const videoPath = await alice.video()?.path();
  await alice.close();
  await bob.close();
  await carol.close();
  await aliceCtx.close();
  await bobCtx.close();
  await carolCtx.close();
  await browser.close();

  if (videoPath && fs.existsSync(videoPath)) {
    fs.copyFileSync(videoPath, OUT_VIDEO);
    console.log(`[done] Video saved to ${OUT_VIDEO}`);
  } else {
    // Playwright may write it slightly after context close — scan the dir
    await sleep(2000);
    const files = fs.readdirSync(VIDEO_DIR).filter((f) => f.endsWith('.webm') && f !== 'retro-demo.webm');
    if (files.length > 0) {
      const src = path.join(VIDEO_DIR, files[0]);
      fs.copyFileSync(src, OUT_VIDEO);
      // Clean up the temp file
      fs.unlinkSync(src);
      console.log(`[done] Video saved to ${OUT_VIDEO}`);
    } else {
      console.warn('[warn] No video file found in', VIDEO_DIR);
    }
  }

  // ── 15. Tear down background processes ────────────────────────────────────
  if (devProc) {
    devProc.kill('SIGTERM');
    console.log('[teardown] Dev server stopped.');
  }
  if (emulatorProc) {
    emulatorProc.kill('SIGTERM');
    console.log('[teardown] Firebase emulator stopped.');
  }
})();
