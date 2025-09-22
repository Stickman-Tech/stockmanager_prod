const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const { Readable } = require("stream");

let browser;

const getStream = async (html, options) => {
  if (!browser) {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      ignoreHTTPSErrors: true,
    });
  }

  const page = (await browser.pages())[0] || await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const buffer = await page.pdf({
    format: "A4",
    printBackground: true,
    ...options,
  });

  // ✅ Correct: convert Buffer to a proper Readable stream
  return Readable.from([buffer]);
};

module.exports = { getStream };
