import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SITE_DISPLAY_NAME } from '@/lib/site';

export type PdfExportOptions = {
  title: string;
  subtitle?: string;
  filename: string;
  /** Cap rows for very large exports. Omit or null = no limit. */
  maxRows?: number | null;
};

const MAX_DEFAULT_ROWS = 5000;

export function buildPdfDocument(
  data: Record<string, unknown>[],
  options: PdfExportOptions
): jsPDF | null {
  if (data.length === 0) return null;

  const limit =
    options.maxRows === null
      ? data.length
      : (options.maxRows ?? MAX_DEFAULT_ROWS);
  const truncated = data.length > limit;
  const rowsToExport = truncated ? data.slice(0, limit) : data;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const generatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(options.title, 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  let y = 24;
  doc.text(`Site: ${SITE_DISPLAY_NAME}`, 14, y);
  y += 6;
  if (options.subtitle) {
    doc.text(options.subtitle, 14, y);
    y += 6;
  }
  doc.text(`Generated: ${generatedAt} (IST)`, 14, y);
  y += 6;
  if (truncated) {
    doc.setTextColor(180, 83, 9);
    doc.text(
      `Showing first ${limit.toLocaleString()} of ${data.length.toLocaleString()} rows. Use CSV for full data.`,
      14,
      y
    );
    y += 6;
  }

  const headers = Object.keys(rowsToExport[0]);
  const body = rowsToExport.map((row) =>
    headers.map((key) => {
      const value = row[key];
      if (value === null || value === undefined) return '';
      return String(value);
    })
  );

  autoTable(doc, {
    head: [headers],
    body,
    startY: y + 4,
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
    didDrawPage: (hookData) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${hookData.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    },
  });

  return doc;
}

export function createPdfBlob(
  data: Record<string, unknown>[],
  options: PdfExportOptions
): Blob | null {
  const doc = buildPdfDocument(data, options);
  if (!doc) return null;
  return doc.output('blob');
}

export function exportToPDF(
  data: Record<string, unknown>[],
  options: PdfExportOptions
): void {
  const doc = buildPdfDocument(data, options);
  if (!doc) return;

  const filename = options.filename.endsWith('.pdf')
    ? options.filename
    : `${options.filename}.pdf`;
  doc.save(filename);
}
