// Renders tools/card.html to public/og.png (1200x630), the link preview and Hackyard card image.
import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto(new URL('card.html', import.meta.url).href);
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: new URL('../public/og.png', import.meta.url).pathname });
await b.close();
