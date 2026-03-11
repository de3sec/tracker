import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: process.env.CI ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
  const page = await browser.newPage();
  
  const BASE = 'http://127.0.0.1:3000';
  console.log("Navigating to login...");
  await page.goto(`${BASE}/login`);

  // Fill in login form
  console.log("Logging in as admin...");
  await page.type('input[type="text"]', 'admin');
  await page.type('input[type="password"]', 'admin123');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);

  if (page.url() === `${BASE}/` || page.url() === `${BASE}`) {
    console.log("Login successful!");
  } else {
    console.error("Login failed!", page.url());
    await browser.close();
    return;
  }

  // Get cookies for API calls
  const cookies = await page.cookies();
  const sessionCookie = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  console.log("Cookies acquired, testing APIs directly using fetch within page...");

  // Expose fetch directly in node if we want, or execute in page context
  const testResults = await page.evaluate(async () => {
    const results = [];
    try {
      // 1. GET claims
      let res = await fetch('/api/claims');
      let data = await res.json();
      results.push(`GET /api/claims status: ${res.status}, count: ${data.claims?.length || 0}`);

      // 2. POST basic claim
      const testClaim = {
        date: new Date().toISOString().split("T")[0],
        partyName: "Puppeteer Test Party",
        vehicleNumber: "TEST-9999",
        tyreModel: "Puppet Model",
        stencilNumber: "STN-PUP1",
        claimDispatchDate: "",
        claimDispatchPlace: "",
        claimPassAmount: 200,
        claimReturnDate: ""
      };
      res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testClaim)
      });
      data = await res.json();
      results.push(`POST /api/claims status: ${res.status}, id: ${data.id}`);
      const newId = data.id;

      if (!newId) throw new Error("POST failed to return ID");

      // 3. PUT target claim
      res = await fetch(`/api/claims/${newId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimPassAmount: 850 })
      });
      data = await res.json();
      results.push(`PUT /api/claims/${newId} status: ${res.status}, newAmount: ${data.claimPassAmount}`);

      // 4. DELETE target claim
      res = await fetch(`/api/claims/${newId}`, {
        method: 'DELETE',
      });
      data = await res.json();
      results.push(`DELETE /api/claims/${newId} status: ${res.status}, success: ${data.success}`);

      // 5. GET claims again to confirm deletion
      res = await fetch('/api/claims');
      data = await res.json();
      results.push(`GET /api/claims after DELETE status: ${res.status}, count: ${data.claims?.length || 0}`);

    } catch (e) {
      results.push(`Error during API test: ${e.message}`);
    }
    return results;
  });

  console.log("\n--- API Test Results ---");
  testResults.forEach(r => console.log(r));

  await browser.close();
})();
