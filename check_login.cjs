const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Try to log in
  console.log("Trying to login...");
  const html = await page.content();
  if (html.includes('Sign in to your account')) {
    console.log("Found login screen");
    // click admin button if it exists, or just enter credentials
    await page.evaluate(() => {
        const adminBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Login as Admin (Demo)'));
        if (adminBtn) adminBtn.click();
    });
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log("After login DOM:");
  console.log(await page.evaluate(() => document.getElementById('root').innerHTML.substring(0, 500)));
  await browser.close();
})();
