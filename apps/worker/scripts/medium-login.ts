import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@medium-publisher/database';
import { createCipheriv, randomBytes, scryptSync } from 'crypto';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' }); // Load root .env

chromium.use(stealth());

const prisma = new PrismaClient();

function encryptCookies(cookiesStr: string): string {
  const key = scryptSync(process.env.ENCRYPTION_KEY ?? 'default-key-change-me', 'salt', 32);
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = cipher.update(cookiesStr, 'utf8', 'hex') + cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: ts-node scripts/medium-login.ts <user-email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User with email ${email} not found in database.`);
    process.exit(1);
  }

  console.log(`\nLaunching browser for ${email}...`);
  console.log('1. Please log in to Medium.');
  console.log('2. Once you are fully logged in and see your homepage, return to this terminal and press ENTER.');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://medium.com/m/signin');

  // Wait for user to press ENTER in the terminal
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise<void>((resolve) => {
    rl.question('\nPress ENTER after you have successfully logged in to Medium...', () => {
      rl.close();
      resolve();
    });
  });

  console.log('Capturing cookies...');
  const cookies = await context.cookies();
  
  // Verify we have the critical session cookies (sid, uid)
  const hasSid = cookies.some(c => c.name === 'sid');
  const hasUid = cookies.some(c => c.name === 'uid');

  if (!hasSid || !hasUid) {
    console.warn('⚠️ WARNING: Critical session cookies (sid or uid) were not found! Are you sure you logged in?');
  }

  const encryptedCookies = encryptCookies(JSON.stringify(cookies));

  await prisma.user.update({
    where: { id: user.id },
    data: { mediumCookies: encryptedCookies },
  });

  console.log('\n✅ Successfully captured and encrypted Medium session cookies!');
  console.log('The worker can now automatically publish blogs on your behalf.');

  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
