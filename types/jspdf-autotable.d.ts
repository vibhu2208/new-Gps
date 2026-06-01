declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableOptions {
    head?: string[][];
    body?: string[][];
    startY?: number;
    styles?: Record<string, unknown>;
    headStyles?: Record<string, unknown>;
    alternateRowStyles?: Record<string, unknown>;
    margin?: { left?: number; right?: number; top?: number; bottom?: number };
    didDrawPage?: (data: { pageNumber: number }) => void;
  }

  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}
