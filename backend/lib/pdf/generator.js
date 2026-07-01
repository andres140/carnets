/**
 * Generador PDF — renderiza HTML de plantilla con Puppeteer.
 */
const puppeteer = require('puppeteer');
const templateEngine = require('../carnetTemplate/engine');

let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }
  return browserPromise;
}

async function htmlToPdf(html, pageConfig = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, {
      waitUntil: pageConfig.waitUntil || 'domcontentloaded',
      timeout: pageConfig.timeout || 30000,
    });

    const pdfOptions = {
      printBackground: true,
      margin: pageConfig.margin || { top: 0, right: 0, bottom: 0, left: 0 },
    };

    if (pageConfig.widthMm && pageConfig.heightMm) {
      pdfOptions.width = `${pageConfig.widthMm}mm`;
      pdfOptions.height = `${pageConfig.heightMm}mm`;
      pdfOptions.preferCSSPageSize = true;
    } else {
      pdfOptions.format = pageConfig.format || 'A4';
      pdfOptions.preferCSSPageSize = Boolean(pageConfig.preferCSSPageSize);
    }

    const pdfBuffer = await page.pdf(pdfOptions);

    return pdfBuffer;
  } finally {
    await page.close();
  }
}

async function generateCarnetPdf(carnet, options = {}) {
  const templateId = options.templateId || carnet.templateId;
  const config = templateEngine.loadConfig(templateId);
  const html = await templateEngine.renderFullDocument(carnet, { templateId });
  return htmlToPdf(html, config.page);
}

async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}

module.exports = { htmlToPdf, generateCarnetPdf, closeBrowser };
