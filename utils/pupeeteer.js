const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

let browser;

const getStream = async (html, options) => {
  if (!browser) {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
  }

  var page = (await browser.pages())[0];
  await page.setContent(html);
  await page.waitForTimeout("*");
  return await page.createPDFStream(options);
};

module.exports = { getStream };
