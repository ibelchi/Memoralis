import { promises as fs } from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
// Utilitzem la versió legacy per Node.js que no depèn del DOM
// @ts-ignore - Les definicions de tipus no cobreixen correctament la ruta legacy
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

export async function pdfToImages(filePath: string): Promise<Buffer[]> {
  try {
    // Comprovem si el fitxer existeix
    await fs.access(filePath);
  } catch (error) {
    throw new Error(`El fitxer no existeix o no és accessible: ${filePath}`);
  }

  try {
    const fileBuffer = await fs.readFile(filePath);
    const data = new Uint8Array(fileBuffer);
    
    // Carreguem el document PDF
    const loadingTask = pdfjsLib.getDocument({
      data,
      disableFontFace: true,
      // Ruta a les fonts estàndard necessàries per Node.js
      standardFontDataUrl: path.join(
        process.cwd(),
        'node_modules',
        'pdfjs-dist',
        'standard_fonts'
      ) + '/'
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    const imageBuffers: Buffer[] = [];

    // Factor d'escala per 150 DPI (un PDF per defecte és de 72 DPI)
    const scale = 150 / 72;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Creem el canvas amb les dimensions de la pàgina
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      const renderContext = {
        canvasContext: context as any, // Cast necessari per la diferència de tipus amb el canvas del navegador
        viewport: viewport,
      };

      // Renderitzem la pàgina al canvas
      await page.render(renderContext).promise;
      
      // Convertim el canvas a un Buffer amb format JPG
      const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
      imageBuffers.push(buffer);
    }

    return imageBuffers;
  } catch (error: any) {
    throw new Error(`Error processant el PDF o no és un PDF vàlid: ${error.message}`);
  }
}
