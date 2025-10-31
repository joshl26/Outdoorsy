// scripts/axe-playwright.mjs
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env.A11Y_BASE || 'http://localhost:4053/outdoorsy';
const PATHS = (
  process.env.A11Y_PATHS || '/,/campgrounds,/login,/register'
).split(',');

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let hasViolations = false;

  for (const p of PATHS) {
    const url = p.startsWith('http') ? p : `${BASE}${p}`;
    console.log(`\nA11Y: Scanning ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (err) {
      console.error(`Failed to load ${url}: ${err.message}`);
      continue;
    }

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (results.violations.length) {
      hasViolations = true;
      console.log(
        `❌ ${results.violations.length} violation(s) found on ${url}`
      );
      for (const v of results.violations) {
        console.log(`\n  [${v.id}] ${v.help}`);
        console.log(`  Impact: ${v.impact || 'n/a'}`);
        console.log(`  Description: ${v.description}`);
        console.log(`  Affected nodes: ${v.nodes.length}`);
        v.nodes.slice(0, 3).forEach((n, i) => {
          console.log(`    ${i + 1}. ${n.html.substring(0, 80)}...`);
          console.log(`       Target: ${n.target.join(' > ')}`);
          if (n.failureSummary) {
            console.log(`       ${n.failureSummary.split('\n')[0]}`);
          }
        });
      }
    } else {
      console.log(`✅ No violations on ${url}`);
    }
  }

  await browser.close();

  if (hasViolations) {
    console.error('\n❌ Accessibility violations detected. Please fix them.');
    process.exit(1);
  } else {
    console.log('\n✅ All pages passed accessibility checks!');
  }
};

run().catch((e) => {
  console.error('Error running accessibility tests:', e);
  process.exit(1);
});
