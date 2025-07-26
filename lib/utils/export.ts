import { formatCurrency } from "@/lib/utils";

interface ExportColumn {
  key: string;
  header: string;
  formatter?: (value: any) => string;
}

export function exportToCSV(
  data: any[],
  columns: ExportColumn[],
  filename: string
) {
  // Create CSV header
  const headers = columns.map(col => col.header).join(',');
  
  // Create CSV rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      const formattedValue = col.formatter ? col.formatter(value) : value;
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(formattedValue || '').replace(/"/g, '""');
      return escaped.includes(',') ? `"${escaped}"` : escaped;
    }).join(',');
  });
  
  // Combine header and rows
  const csv = [headers, ...rows].join('\n');
  
  // Create blob and download
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado'
  };
  return statusMap[status] || status;
}

export function formatPaymentStatus(status: string | null): string {
  if (!status) return 'Pendiente';
  const statusMap: Record<string, string> = {
    succeeded: 'Completado',
    pending: 'Pendiente',
    failed: 'Fallido'
  };
  return statusMap[status] || status;
}