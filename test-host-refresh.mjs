import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function test() {
  const browser = await chromium.launch({ headless: true });

  // === HOST: Create poker session ===
  const hostCtx = await browser.newContext();
  const hostPage = await hostCtx.newPage();
  hostPage.on('pageerror', e => console.log(`[HOST pageerror] ${e.message}`));

  await hostPage.goto(`${BASE}/poker`, { waitUntil: 'networkidle' });
  await hostPage.locator('input').first().fill('HostUser');
  await hostPage.waitForTimeout(500);
  await hostPage.locator('button.MuiButton-contained:has-text("Create Session")').click();
  console.log('[HOST] Clicked Create Session...');

  await hostPage.waitForURL(/\/poker\/session\//, { timeout: 15000 });
  const sessionUrl = hostPage.url();
  const sessionId = sessionUrl.split('/poker/session/')[1];
  console.log(`[HOST] Session: ${sessionId}`);

  await hostPage.waitForTimeout(3000);
  const preText = await hostPage.innerText('body');
  const hasEndBefore = preText.includes('END SESSION');
  const hasAssignBefore = preText.includes('ASSIGN HOST');
  console.log(`[HOST] Before refresh — END SESSION: ${hasEndBefore}, ASSIGN HOST: ${hasAssignBefore}`);

  // === ATTENDANT joins ===
  const attCtx = await browser.newContext();
  const attPage = await attCtx.newPage();
  attPage.on('dialog', async d => {
    console.log(`[ATT] Prompt -> accepting "AttendantUser"`);
    await d.accept('AttendantUser');
  });
  await attPage.goto(sessionUrl, { waitUntil: 'networkidle' });
  await attPage.waitForTimeout(4000);

  const attText = await attPage.innerText('body');
  console.log(`[ATT] Joined. Host controls? END SESSION: ${attText.includes('END SESSION')}`);

  // === HOST REFRESHES ===
  console.log('\n=== HOST REFRESHES PAGE ===');
  hostPage.on('dialog', async d => {
    console.log(`[HOST] Prompt on refresh -> accepting "HostUser"`);
    await d.accept('HostUser');
  });

  await hostPage.reload({ waitUntil: 'networkidle' });
  await hostPage.waitForTimeout(5000);

  const postText = await hostPage.innerText('body');
  const hasEndAfter = postText.includes('END SESSION');
  const hasAssignAfter = postText.includes('ASSIGN HOST');
  console.log(`[HOST] After refresh — END SESSION: ${hasEndAfter}, ASSIGN HOST: ${hasAssignAfter}`);

  if (!hasEndAfter || !hasAssignAfter) {
    console.log('\n*** BUG: Host LOST controls after refresh! ***');

    await attPage.reload({ waitUntil: 'networkidle' });
    await attPage.waitForTimeout(3000);
    const attPost = await attPage.innerText('body');
    console.log(`[ATT] Got host? END SESSION: ${attPost.includes('END SESSION')}, ASSIGN HOST: ${attPost.includes('ASSIGN HOST')}`);
  } else {
    console.log('\nHost controls PRESERVED after refresh. No bug.');
  }

  // === RETRO TEST ===
  console.log('\n\n=== RETRO HOST REFRESH TEST ===');
  const rHostPage = await hostCtx.newPage();

  await rHostPage.goto(`${BASE}/retro`, { waitUntil: 'networkidle' });
  await rHostPage.locator('input').first().fill('RetroHost');
  await rHostPage.waitForTimeout(500);
  await rHostPage.locator('button.MuiButton-contained:has-text("Create Session")').click();
  await rHostPage.waitForURL(/\/retro\/session\//, { timeout: 15000 });
  const retroUrl = rHostPage.url();
  console.log(`[RETRO HOST] Session: ${retroUrl}`);

  await rHostPage.waitForTimeout(3000);
  const rPreText = await rHostPage.innerText('body');
  console.log(`[RETRO HOST] Before refresh — END SESSION: ${rPreText.includes('END SESSION')}, ASSIGN HOST: ${rPreText.includes('ASSIGN HOST')}`);

  // Attendant joins retro
  const rAttPage = await attCtx.newPage();
  rAttPage.on('dialog', async d => await d.accept('RetroAtt'));
  await rAttPage.goto(retroUrl, { waitUntil: 'networkidle' });
  await rAttPage.waitForTimeout(4000);

  // Host refreshes
  console.log('[RETRO HOST] === REFRESHING ===');
  rHostPage.on('dialog', async d => {
    console.log(`[RETRO HOST] Prompt on refresh -> "RetroHost"`);
    await d.accept('RetroHost');
  });
  await rHostPage.reload({ waitUntil: 'networkidle' });
  await rHostPage.waitForTimeout(5000);

  const rPostText = await rHostPage.innerText('body');
  const rHasEnd = rPostText.includes('END SESSION');
  const rHasAssign = rPostText.includes('ASSIGN HOST');
  console.log(`[RETRO HOST] After refresh — END SESSION: ${rHasEnd}, ASSIGN HOST: ${rHasAssign}`);

  if (!rHasEnd || !rHasAssign) {
    console.log('\n*** BUG: Retro host LOST controls after refresh! ***');
    await rAttPage.reload({ waitUntil: 'networkidle' });
    await rAttPage.waitForTimeout(3000);
    const rAttPost = await rAttPage.innerText('body');
    console.log(`[RETRO ATT] Got host? END SESSION: ${rAttPost.includes('END SESSION')}`);
  } else {
    console.log('\nRetro host controls PRESERVED. No bug.');
  }

  await browser.close();
  console.log('\n=== DONE ===');
}

test().catch(e => {
  console.error('CRASH:', e.message);
  process.exit(1);
});
