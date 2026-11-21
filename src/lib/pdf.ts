// PDF documents with the NACOS MOUAU letterhead. jsPDF is loaded only when a PDF is requested.
import type { SiteSettings } from '../types/content';

export interface PdfTable {
  title: string;
  subtitle?: string;
  details?: [string, string][];
  head: string[];
  body: (string | number)[][];
  columnWidths?: (number | 'auto')[];
  signatures?: string[];
  fileName: string;
  landscape?: boolean;
  note?: string;
}

async function logoPng(url?: string | null): Promise<{ data: string; w: number; h: number } | null> {
  if (!url) return null;
  try {
    const response = await fetch(url, { credentials: 'include' }); if (!response.ok) return null;
    const bitmap = await createImageBitmap(await response.blob());
    const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
    return { data: canvas.toDataURL('image/png'), w: bitmap.width, h: bitmap.height };
  } catch { return null; }
}

const GREEN: [number, number, number] = [0, 135, 81];

export async function downloadLetterheadPdf(table: PdfTable, settings?: Partial<SiteSettings> | null) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const autoTable = autoTableModule.default;
  const [left, right] = await Promise.all([logoPng(settings?.logo_url), logoPng(settings?.secondary_logo_url)]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: table.landscape ? 'landscape' : 'portrait' });
  const pageW = doc.internal.pageSize.getWidth(); const pageH = doc.internal.pageSize.getHeight(); const margin = 14;
  const institution = settings?.institution_name || 'Michael Okpara University of Agriculture, Umudike';

  const drawLogo = (logo: { data: string; w: number; h: number } | null, x: number, align: 'left' | 'right') => {
    if (!logo) return; const box = 24; const ratio = logo.w / logo.h;
    const w = ratio >= 1 ? box : box * ratio; const h = ratio >= 1 ? box / ratio : box;
    doc.addImage(logo.data, 'PNG', align === 'left' ? x : x - w, 9 + (box - h) / 2, w, h);
  };
  const letterhead = () => {
    drawLogo(left, margin, 'left'); drawLogo(right, pageW - margin, 'right');
    doc.setTextColor(...GREEN); doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text('NATIONAL ASSOCIATION OF COMPUTING STUDENTS', pageW / 2, 16, { align: 'center' });
    doc.setTextColor(20, 20, 20); doc.setFontSize(11); doc.text('MOUAU CHAPTER', pageW / 2, 22, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(80, 80, 80);
    doc.text(institution, pageW / 2, 27, { align: 'center' });
    doc.setDrawColor(...GREEN); doc.setLineWidth(0.9); doc.line(margin, 36, pageW - margin, 36);
    doc.setDrawColor(20, 20, 20); doc.setLineWidth(0.2); doc.line(margin, 37.6, pageW - margin, 37.6);
  };

  let y = 45;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(table.title.toUpperCase(), pageW - margin * 2) as string[];
  titleLines.forEach(line => { doc.text(line, pageW / 2, y, { align: 'center' }); y += 6; });
  if (table.subtitle) { doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(80, 80, 80); doc.text(table.subtitle, pageW / 2, y, { align: 'center' }); y += 6; }
  if (table.details?.length) {
    doc.setFontSize(9.5); y += 1;
    table.details.forEach(([label, value]) => { doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20); doc.text(`${label}:`, margin, y); doc.setFont('helvetica', 'normal'); doc.text(value, margin + 38, y); y += 5.2; });
  }
  y += 2;

  const columnStyles: Record<number, { cellWidth: number | 'auto' }> = {};
  (table.columnWidths ?? []).forEach((w, i) => { columnStyles[i] = { cellWidth: w }; });
  autoTable(doc, {
    startY: y, head: [table.head], body: table.body.map(r => r.map(String)), theme: 'grid', margin: { left: margin, right: margin, top: 42, bottom: 18 }, columnStyles,
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.2, lineColor: [200, 205, 202], lineWidth: 0.2, textColor: [25, 25, 25], valign: 'middle' },
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold' }, alternateRowStyles: { fillColor: [245, 248, 246] },
    didDrawPage: () => { letterhead(); },
  });

  type Last = { lastAutoTable?: { finalY: number } };
  let endY = ((doc as unknown as Last).lastAutoTable?.finalY ?? y) + 8;
  if (table.note) { if (endY > pageH - 40) { doc.addPage(); letterhead(); endY = 46; } doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(90, 90, 90); (doc.splitTextToSize(table.note, pageW - margin * 2) as string[]).forEach(l => { doc.text(l, margin, endY); endY += 4.4; }); endY += 4; }
  if (table.signatures?.length) {
    if (endY > pageH - 44) { doc.addPage(); letterhead(); endY = 50; }
    const gap = (pageW - margin * 2) / table.signatures.length;
    table.signatures.forEach((label, i) => {
      const x = margin + i * gap; doc.setDrawColor(20, 20, 20); doc.setLineWidth(0.3); doc.line(x, endY + 12, x + gap - 10, endY + 12);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60, 60, 60); doc.text(label, x, endY + 17); doc.text('Date: ____________', x, endY + 22);
    });
  }

  const pages = doc.getNumberOfPages(); const stamp = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120, 120, 120);
    doc.setDrawColor(210, 214, 212); doc.setLineWidth(0.2); doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.text(`Generated ${stamp} from the NACOS MOUAU platform`, margin, pageH - 7.5); doc.text(`Page ${i} of ${pages}`, pageW - margin, pageH - 7.5, { align: 'right' });
  }
  doc.save(table.fileName);
}
