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

  const page = (await browser.pages())[0] || (await browser.newPage());

  // render HTML (from EJS or static string)
  await page.setContent(html, { waitUntil: "networkidle0" });

  // generate PDF buffer
  const buffer = await page.pdf({
    format: "A4",
    printBackground: true,
    ...options,
  });

  // wrap buffer into a Readable stream (so you can pipe just like before)
  return Readable.from(buffer);
};

module.exports = { getStream };
