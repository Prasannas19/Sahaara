import type { DoseSlot } from '../types';

/**
 * Escapes values for RFC 4180 compliant CSV output.
 * Replaces newlines with single spaces and escapes double-quotes with double double-quotes.
 */
export function escapeCSVField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/\r\n|\r|\n/g, ' ');
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Generates structured medication adherence report CSV content.
 */
export function generateMedicationReportCSV(params: {
  elderName: string;
  circleId: string;
  slots: DoseSlot[];
  generatedAt?: string;
}): string {
  const { elderName, circleId, slots, generatedAt = new Date().toISOString() } = params;
  const takenCount = slots.filter((s) => s.status === 'taken').length;
  const adherencePercent = slots.length > 0 ? Math.round((takenCount / slots.length) * 100) : 0;

  const metadataHeaders = [
    `# Sahaara Medication Adherence Report - ${elderName}`,
    `# Care Circle ID: ${circleId}`,
    `# Generated On: ${generatedAt}`,
    `# Total Scheduled Today: ${slots.length}`,
    `# Adherence Score: ${adherencePercent}%`,
    '',
  ];

  const columnHeaders = [
    'Date',
    'Scheduled Time',
    'Medication',
    'Dosage',
    'Status',
    'Recorded By',
    'Instructions & Notes',
  ];

  if (slots.length === 0) {
    return [
      ...metadataHeaders,
      columnHeaders.join(','),
      '# No medication records found for this period',
    ].join('\n');
  }

  const rows = slots.map((s) => [
    escapeCSVField(new Date(s.scheduledAt).toISOString().split('T')[0]),
    escapeCSVField(s.scheduledTimeStr),
    escapeCSVField(s.medication.name),
    escapeCSVField(s.medication.dosage || 'Prescribed dose'),
    escapeCSVField(s.status.toUpperCase()),
    escapeCSVField(s.event?.resolvedBy ? (s.event.resolvedBy === 'elder' ? 'Elder' : 'Caretaker') : 'Unrecorded'),
    escapeCSVField(s.event?.notes || s.medication.instructions || ''),
  ]);

  return [
    ...metadataHeaders,
    columnHeaders.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\n');
}

/**
 * Triggers a real browser file download for a generated CSV string.
 */
export function triggerCSVDownload(filename: string, csvContent: string): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
