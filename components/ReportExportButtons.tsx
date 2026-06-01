'use client';

import { Download, FileSpreadsheet } from 'lucide-react';

type ReportExportButtonsProps = {
  onExportCsv: () => void | Promise<void>;
  onExportPdf: () => void | Promise<void>;
  disabled?: boolean;
  isExporting?: boolean;
  csvLabel?: string;
  pdfLabel?: string;
  className?: string;
};

export default function ReportExportButtons({
  onExportCsv,
  onExportPdf,
  disabled = false,
  isExporting = false,
  csvLabel = 'Export Excel (CSV)',
  pdfLabel = 'Export PDF',
  className = '',
}: ReportExportButtonsProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      <button
        type="button"
        onClick={onExportCsv}
        disabled={disabled || isExporting}
        className="flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
      >
        <FileSpreadsheet className="w-5 h-5 text-green-600" />
        {isExporting ? 'Exporting…' : csvLabel}
      </button>
      <button
        type="button"
        onClick={onExportPdf}
        disabled={disabled || isExporting}
        className="flex items-center justify-center gap-2 bg-white border-2 border-red-300 text-red-800 py-3 rounded-lg hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
      >
        <Download className="w-5 h-5 text-red-600" />
        {isExporting ? 'Exporting…' : pdfLabel}
      </button>
    </div>
  );
}
