import { format, parseISO } from 'date-fns';
import JSZip from 'jszip';
import { createPdfBlob } from '@/lib/export-pdf';

const PDF_MONTH_COUNT = 3;

export type VehicleHistoryRow = Record<string, unknown> & {
  Date?: string;
};

/** Group history rows by calendar month (yyyy-MM) from the Date column */
export function groupVehicleHistoryByMonth(
  rows: VehicleHistoryRow[]
): Map<string, VehicleHistoryRow[]> {
  const byMonth = new Map<string, VehicleHistoryRow[]>();

  for (const row of rows) {
    const dateStr = String(row.Date ?? '');
    const monthKey = dateStr.length >= 7 ? dateStr.slice(0, 7) : '';
    if (!monthKey) continue;
    const bucket = byMonth.get(monthKey) ?? [];
    bucket.push(row);
    byMonth.set(monthKey, bucket);
  }

  for (const [, monthRows] of byMonth) {
    monthRows.sort(
      (a, b) =>
        new Date(String(a.Timestamp ?? a.Date)).getTime() -
        new Date(String(b.Timestamp ?? b.Date)).getTime()
    );
  }

  return byMonth;
}

/** Last N calendar months present in the data (chronological order) */
export function getMonthKeysForPdfExport(byMonth: Map<string, VehicleHistoryRow[]>): string[] {
  const sorted = Array.from(byMonth.keys()).sort();
  if (sorted.length <= PDF_MONTH_COUNT) return sorted;
  return sorted.slice(-PDF_MONTH_COUNT);
}

export type MonthlyVehiclePdfOptions = {
  vehicleName: string;
  plateNumber: string;
};

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Build one PDF per month (3 max) and download a single ZIP containing all of them.
 * Excel/CSV should use the full dataset separately.
 */
export async function exportCompleteVehicleHistoryMonthlyPDFs(
  allData: VehicleHistoryRow[],
  options: MonthlyVehiclePdfOptions
): Promise<{ monthCount: number; totalRows: number }> {
  const byMonth = groupVehicleHistoryByMonth(allData);
  const monthKeys = getMonthKeysForPdfExport(byMonth);

  if (monthKeys.length === 0) {
    return { monthCount: 0, totalRows: 0 };
  }

  const { vehicleName, plateNumber } = options;
  const zip = new JSZip();
  let totalRows = 0;

  for (const monthKey of monthKeys) {
    const monthData = byMonth.get(monthKey) ?? [];
    totalRows += monthData.length;

    const monthLabel = format(parseISO(`${monthKey}-01`), 'MMMM yyyy');
    const pdfFilename = `complete-vehicle-${plateNumber}-${monthKey}.pdf`;

    const blob = createPdfBlob(monthData, {
      title: 'Complete Vehicle History',
      subtitle: `${vehicleName} (${plateNumber}) — ${monthLabel}`,
      filename: pdfFilename,
      maxRows: null,
    });

    if (blob) {
      zip.file(pdfFilename, blob);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(
    zipBlob,
    `complete-vehicle-${plateNumber}-history-${monthKeys[0]}-to-${monthKeys[monthKeys.length - 1]}.zip`
  );

  return { monthCount: monthKeys.length, totalRows };
}
