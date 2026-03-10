/**
 * E2E test helper using Playwright.
 * Usage: node e2e-helper.mjs <role> <action> [args...]
 *
 * Roles: host, attendant1, attendant2
 * Actions:
 *   create-retro <categories>     → creates retro session, returns sessionId
 *   join-retro <sessionId> <name> → joins retro, returns page info
 *   create-poker <cardSet>        → creates poker session, returns sessionId
 *   join-poker <sessionId> <name> → joins poker, returns page info
 *   screenshot <sessionId> <name> → takes screenshot
 *   eval <url> <script>           → navigate to url and eval script, return result
 *   navigate <url>                → navigate and return page content
 */

import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function run() {
  const [,, role, action, ...args] = process.argv;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console errors
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    switch (action) {
      case 'navigate': {
        const [url] = args;
        const response = await page.goto(url || BASE, { waitUntil: 'networkidle', timeout: 15000 });
        const status = response?.status();
        const title = await page.title();
        const content = await page.content();
        const text = await page.innerText('body').catch(() => '');
        console.log(JSON.stringify({ status, title, text: text.slice(0, 3000), errors, url: page.url() }));
        break;
      }

      case 'create-retro': {
        await page.goto(`${BASE}/retro`, { waitUntil: 'networkidle', timeout: 15000 });
        const text = await page.innerText('body').catch(() => '');
        // Look for create session button/form
        const html = await page.content();
        console.log(JSON.stringify({ text: text.slice(0, 3000), errors, url: page.url(), html: html.slice(0, 5000) }));
        break;
      }

      case 'create-poker': {
        await page.goto(`${BASE}/poker`, { waitUntil: 'networkidle', timeout: 15000 });
        const text = await page.innerText('body').catch(() => '');
        const html = await page.content();
        console.log(JSON.stringify({ text: text.slice(0, 3000), errors, url: page.url(), html: html.slice(0, 5000) }));
        break;
      }

      case 'interact': {
        const [url, scriptStr] = args;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        // Execute arbitrary test script
        const result = await page.evaluate(scriptStr);
        const text = await page.innerText('body').catch(() => '');
        console.log(JSON.stringify({ result, text: text.slice(0, 3000), errors, url: page.url() }));
        break;
      }

      case 'click-and-report': {
        const [url, selector, waitSelector] = args;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        if (selector) {
          await page.click(selector, { timeout: 5000 }).catch(e => errors.push(`Click failed: ${e.message}`));
        }
        if (waitSelector) {
          await page.waitForSelector(waitSelector, { timeout: 5000 }).catch(e => errors.push(`Wait failed: ${e.message}`));
        }
        const text = await page.innerText('body').catch(() => '');
        console.log(JSON.stringify({ text: text.slice(0, 3000), errors, url: page.url() }));
        break;
      }

      case 'fill-and-submit': {
        const [url, ...pairs] = args;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        // pairs: selector1 value1 selector2 value2 ... submitSelector
        for (let i = 0; i < pairs.length - 1; i += 2) {
          await page.fill(pairs[i], pairs[i + 1], { timeout: 5000 }).catch(e => errors.push(`Fill failed: ${e.message}`));
        }
        if (pairs.length % 2 === 1) {
          await page.click(pairs[pairs.length - 1], { timeout: 5000 }).catch(e => errors.push(`Submit click failed: ${e.message}`));
        }
        await page.waitForTimeout(2000);
        const text = await page.innerText('body').catch(() => '');
        console.log(JSON.stringify({ text: text.slice(0, 3000), errors, url: page.url() }));
        break;
      }

      case 'full-flow': {
        const [url, name] = args;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

        // Handle prompt for name if it appears
        page.on('dialog', async dialog => {
          await dialog.accept(name || role);
        });

        await page.waitForTimeout(2000);
        const text = await page.innerText('body').catch(() => '');
        const screenshots = `./e2e-screenshots/${role}-${Date.now()}.png`;
        await page.screenshot({ path: screenshots, fullPage: true }).catch(() => {});
        console.log(JSON.stringify({ text: text.slice(0, 3000), errors, url: page.url(), screenshot: screenshots }));
        break;
      }

      default:
        console.log(JSON.stringify({ error: `Unknown action: ${action}` }));
    }
  } catch (err) {
    console.log(JSON.stringify({ error: err.message, stack: err.stack, errors }));
  } finally {
    await browser.close();
  }
}

run();
