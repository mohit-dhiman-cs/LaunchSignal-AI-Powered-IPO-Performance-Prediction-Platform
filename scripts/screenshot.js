const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');

(async () => {
  console.log("Starting browser...");
  const browser = await puppeteer.launch({ 
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,900'
    ]
  });
  const page = await browser.newPage();
  
  // Set viewport to a nice desktop size
  await page.setViewport({ width: 1280, height: 900 });

  const desktopPath = path.join(os.homedir(), 'Desktop');
  const baseUrl = 'https://launchsignal-ai-powered-ipo-performance-prediction-platfor.pages.dev';

  console.log(`Navigating to ${baseUrl}...`);
  await page.goto(baseUrl, { waitUntil: 'networkidle2' });

  // 1. Hero & Empty Form
  console.log("Taking Screenshot 1 (Hero & Empty State)...");
  await page.screenshot({ path: path.join(desktopPath, 'LaunchSignal_1_Hero.png'), fullPage: false });

  // 2. Fill the form to get the prediction results
  console.log("Filling out prediction form...");
  await page.type('input[placeholder="Type to search — e.g. Zomato, LIC, Paytm..."]', 'Tata Tech');
  await new Promise(r => setTimeout(r, 500));
  
  // Try to click the autocomplete suggestion if it appears
  try {
    await page.click('ul[role="listbox"] li:first-child');
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {
    // Fallback: fill manually
    await page.type('input[placeholder="e.g. 2000"]', '400'); // Issue Size
    await page.type('input[placeholder="e.g. 80.2"]', '60'); // QIB
    await page.type('input[placeholder="e.g. 25.0"]', '20'); // NII
    await page.type('input[placeholder="e.g. 15.5"]', '10'); // Retail
    await page.type('input[placeholder="e.g. 120"]', '150'); // GMP
  }

  // Click Predict Button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const predictBtn = btns.find(b => b.textContent.includes('Analyze & Predict'));
    if (predictBtn) predictBtn.click();
  });

  console.log("Waiting for prediction results...");
  await new Promise(r => setTimeout(r, 4000)); // wait for loader & animation

  // 3. Take screenshot of the Form + Result Card + Score Card
  console.log("Taking Screenshot 2 (Prediction Result)...");
  await page.screenshot({ path: path.join(desktopPath, 'LaunchSignal_2_Prediction.png'), fullPage: false });

  // 4. Scroll down to Explainability & What-If
  console.log("Scrolling to Analytics...");
  await page.evaluate(() => window.scrollBy(0, 600));
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Taking Screenshot 3 (AI Explainability)...");
  await page.screenshot({ path: path.join(desktopPath, 'LaunchSignal_3_Analytics.png'), fullPage: false });

  // 5. Navigate to Market Page
  console.log("Navigating to Market Analysis page...");
  await page.goto(`${baseUrl}/market`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000)); // wait for charts to load
  
  console.log("Taking Screenshot 4 (Market Dashboard)...");
  await page.screenshot({ path: path.join(desktopPath, 'LaunchSignal_4_Market.png'), fullPage: false });

  await browser.close();
  console.log("All screenshots saved to your Desktop!");
})();
