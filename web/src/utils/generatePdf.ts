import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PAGE_IDS = ['pdf-page-1', 'pdf-page-2', 'pdf-page-3', 'pdf-page-4', 'pdf-page-5'];
const PDF_W_MM = 210;   // A4 width in mm
const PDF_H_MM = 297;   // A4 height in mm

export async function generatePdf(filename = 'DataCompass-Reporte.pdf'): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let pagesAdded = 0;

  for (let i = 0; i < PAGE_IDS.length; i++) {
    const el = document.getElementById(PAGE_IDS[i]);
    if (!el) {
      console.warn(`PDF: element #${PAGE_IDS[i]} not found, skipping`);
      continue;
    }

    const canvas = await html2canvas(el, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0f172a',
      logging: false,
      removeContainer: true,
      onclone: (_doc, clonedEl) => {
        // Remove global stylesheets so Tailwind's oklch vars don't break html2canvas
        _doc.querySelectorAll('style, link[rel="stylesheet"]').forEach(s => s.remove());

        // Ensure element and ancestors are fully visible for capture
        let node: HTMLElement | null = clonedEl;
        while (node && node !== _doc.body) {
          node.style.opacity = '1';
          node = node.parentElement;
        }

        // Strip residual oklch values from inline styles
        clonedEl.querySelectorAll<HTMLElement>('*').forEach(n => {
          const s = n.style;
          for (let i = s.length - 1; i >= 0; i--) {
            const p = s[i];
            if (s.getPropertyValue(p).includes('oklch')) s.removeProperty(p);
          }
        });
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.9);

    if (pagesAdded > 0) pdf.addPage();
    // Always fill the full A4 page — canvas is already fixed A4 dimensions
    pdf.addImage(imgData, 'JPEG', 0, 0, PDF_W_MM, PDF_H_MM);

    pagesAdded++;
  }

  if (pagesAdded === 0) throw new Error('No pages were captured');
  pdf.save(filename);
}

/** Capture the radar chart canvas as a base64 image for embedding in PdfReport */
export function captureRadarImage(): string {
  // The Chart.js radar renders inside a <canvas> inside the radar card
  const canvasList = document.querySelectorAll<HTMLCanvasElement>('canvas');
  for (const c of canvasList) {
    if (c.width > 100 && c.height > 100) {
      return c.toDataURL('image/png');
    }
  }
  return '';
}
