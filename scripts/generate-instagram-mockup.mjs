import { chromium } from 'playwright';
import { createCanvas, loadImage, registerFont } from 'canvas';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'marketing');
const url = 'http://localhost:3456';

const W = 1080;
const H = 1350;

async function captureScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3500);

  const shotPath = join(outDir, 'website-screenshot.png');
  await page.screenshot({ path: shotPath, fullPage: false });
  await browser.close();
  return shotPath;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function createMockup(screenshotPath) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const screenshot = await loadImage(screenshotPath);

  // Background
  ctx.fillStyle = '#f8f6f2';
  ctx.fillRect(0, 0, W, H);

  // Top accent bar
  ctx.fillStyle = '#b8954a';
  ctx.fillRect(0, 0, W, 8);

  // Header branding
  ctx.fillStyle = '#1c1c1c';
  ctx.font = '600 52px Georgia, serif';
  ctx.fillText('Prestige Immobilien', 72, 110);

  ctx.fillStyle = '#b8954a';
  ctx.font = '500 22px sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('NEUE WEBSEITE', 72, 148);

  ctx.fillStyle = '#6e6e6e';
  ctx.font = '400 28px sans-serif';
  ctx.fillText('Exklusive Immobilien. Persönliche Beratung.', 72, 195);

  // Browser mockup frame
  const frameX = 72;
  const frameY = 240;
  const frameW = W - 144;
  const frameH = 820;
  const radius = 20;

  ctx.shadowColor = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, frameX, frameY, frameW, frameH, radius);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Browser chrome
  const chromeH = 48;
  ctx.save();
  roundRect(ctx, frameX, frameY, frameW, frameH, radius);
  ctx.clip();

  ctx.fillStyle = '#f0ede6';
  ctx.fillRect(frameX, frameY, frameW, chromeH);

  const dots = ['#e8a0a0', '#e8d5a3', '#a8d5a8'];
  dots.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(frameX + 24 + i * 22, frameY + 24, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, frameX + 100, frameY + 12, frameW - 200, 24, 12);
  ctx.fill();
  ctx.fillStyle = '#9a9a9a';
  ctx.font = '400 14px sans-serif';
  ctx.fillText('prestige-immobilien.de', frameX + 120, frameY + 29);

  // Screenshot inside frame
  const imgX = frameX;
  const imgY = frameY + chromeH;
  const imgW = frameW;
  const imgH = frameH - chromeH;

  const scale = Math.max(imgW / screenshot.width, imgH / screenshot.height);
  const sw = screenshot.width * scale;
  const sh = screenshot.height * scale;
  const sx = imgX + (imgW - sw) / 2;
  const sy = imgY;

  ctx.drawImage(screenshot, sx, sy, sw, sh);
  ctx.restore();

  // Bottom CTA area
  const ctaY = frameY + frameH + 48;
  ctx.fillStyle = '#1c1c1c';
  ctx.font = 'italic 42px Georgia, serif';
  ctx.fillText('Wo Träume ein Zuhause finden', 72, ctaY);

  ctx.fillStyle = '#b8954a';
  roundRect(ctx, 72, ctaY + 28, 280, 56, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 18px sans-serif';
  ctx.fillText('JETZT ENTDECKEN', 108, ctaY + 63);

  ctx.fillStyle = '#6e6e6e';
  ctx.font = '400 22px sans-serif';
  ctx.fillText('Premium Immobilien seit 2008', 72, H - 72);

  // Gold line accent
  ctx.fillStyle = '#b8954a';
  ctx.fillRect(72, H - 48, 80, 3);

  const pngPath = join(outDir, 'prestige-immobilien-instagram.png');
  await writeFile(pngPath, canvas.toBuffer('image/png'));
  return pngPath;
}

await mkdir(outDir, { recursive: true });
const screenshotPath = await captureScreenshot();
const mockupPath = await createMockup(screenshotPath);
console.log('Created:', mockupPath);
