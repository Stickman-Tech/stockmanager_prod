const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

let browser;

const getStream = async (html, options) => {
  if (!browser) {
    browser = await puppeteer.launch({
      args: chromium.args,
      // defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
      ignoreHTTPSErrors: true,
    });
  }

  const page = (await browser.pages())[0] || await browser.newPage();

  // set content and wait until all network requests are done
  await page.setContent(html, { waitUntil: "networkidle0" });

  // now generate PDF stream
  return await page.createPDFStream(options);
};

module.exports = { getStream };
