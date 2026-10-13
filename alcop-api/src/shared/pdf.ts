import { chromium } from 'playwright'
import { env } from '../config/env.js'

/**
 * Renderiza HTML a PDF con Chromium headless (Playwright). El reporte de visita
 * es HTML self-contained (imágenes embebidas como data URI) — Docs/tecnica.md §4
 * dec. 3. En Docker se usa el Chromium del sistema vía PLAYWRIGHT_EXECUTABLE_PATH;
 * en local, el que Playwright tenga instalado.
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await chromium.launch({
    executablePath: env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
