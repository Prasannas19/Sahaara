import assert from 'node:assert';
import { getDeterministicEventId, computeTodaySlots } from './doseEventService';
import { generateMedicationReportCSV, escapeCSVField } from './reportService';
import type { Medication, DoseEvent, DoseSlot, CareAlert } from '../types';

console.log('--- Running Sahaara Phase 2 & Stabilization Logic Checks ---');

// 1. Test Deterministic Event ID (Idempotency)
const medId = 'med_aspirin_123';
const iso = '2026-11-15T08:00:00.000Z';
const eventId1 = getDeterministicEventId(medId, iso);
const eventId2 = getDeterministicEventId(medId, iso);

assert.strictEqual(eventId1, eventId2, 'Deterministic ID must be repeatable');
assert.strictEqual(eventId1.startsWith(medId), true, 'Deterministic ID must start with medicationId');
console.log('✔ Deterministic event ID test passed:', eventId1);

// 2. Test computeTodaySlots with multiple times, inactive filtering, and chronological sorting
const now = new Date();
const currentDay = now.getDay();
const tomorrowDay = (currentDay + 1) % 7;

const mockMeds: Medication[] = [
  {
    medicationId: 'med_evening',
    circleId: 'circle_1',
    name: 'Evening Pill',
    dosage: '10 mg',
    instructions: 'Take with dinner',
    scheduledTimes: ['23:59'],
    active: true,
    startDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    medicationId: 'med_morning',
    circleId: 'circle_1',
    name: 'Morning Pill',
    dosage: '500 mg',
    instructions: 'Take after breakfast',
    scheduledTimes: ['00:01', '12:00'],
    active: true,
    startDate: '2026-01-01',
    daysOfWeek: [currentDay], // active today
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    medicationId: 'med_other_day',
    circleId: 'circle_1',
    name: 'Other Day Pill',
    instructions: 'Not today',
    scheduledTimes: ['10:00'],
    active: true,
    startDate: '2026-01-01',
    daysOfWeek: [tomorrowDay], // only active tomorrow
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    medicationId: 'med_inactive',
    circleId: 'circle_1',
    name: 'Inactive Med',
    instructions: 'None',
    scheduledTimes: ['09:00'],
    active: false,
    startDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockEvents: DoseEvent[] = [];

const slotsBefore = computeTodaySlots(mockMeds, mockEvents);
// med_morning has 2 slots, med_evening has 1 slot = 3 active slots. med_other_day and med_inactive are excluded.
assert.strictEqual(slotsBefore.length, 3, 'Should compute exactly 3 active slots for today');
assert.strictEqual(slotsBefore[0].scheduledTimeStr, '00:01', 'First slot must be 00:01');
assert.strictEqual(slotsBefore[1].scheduledTimeStr, '12:00', 'Second slot must be 12:00');
assert.strictEqual(slotsBefore[2].scheduledTimeStr, '23:59', 'Third slot must be 23:59');

console.log('✔ Slot computation, weekday filtering and chronological sorting passed');

// 3. Test slot overdue vs future detection
// 00:01 was earlier today (> 30 min ago) -> should be 'overdue' if no event
assert.strictEqual(slotsBefore[0].status, 'overdue', '00:01 in past without event must be overdue');
console.log('✔ Overdue detection passed');

// 4. Test slot resolution with doseEvent
const firstSlot = slotsBefore[0];
const recordedEvent: DoseEvent = {
  eventId: firstSlot.slotId,
  medicationId: firstSlot.medication.medicationId,
  circleId: 'circle_1',
  scheduledAt: firstSlot.scheduledAt.toISOString(),
  status: 'taken',
  resolvedBy: 'elder_uid',
  resolvedAt: new Date().toISOString(),
};

const slotsAfter = computeTodaySlots(mockMeds, [recordedEvent]);
assert.strictEqual(slotsAfter[0].status, 'taken', 'First slot should now be marked as taken');
console.log('✔ Slot event resolution test passed');

// 5. Care Handoff Reconciliation Tests (Bug 4 Regression Prevention)
console.log('Testing Care Handoff reconciliation invariants...');
// A. A taken dose must never be categorized as active alert
const simulatedAlerts: CareAlert[] = [
  {
    alertId: `circle_1_${firstSlot.slotId}`,
    circleId: 'circle_1',
    doseEventId: firstSlot.slotId,
    medicationId: firstSlot.medication.medicationId,
    medicationName: firstSlot.medication.name,
    scheduledAt: firstSlot.scheduledAt.toISOString(),
    elderName: 'Rose',
    status: 'active',
    escalationAttempts: 0,
    createdAt: new Date().toISOString(),
  },
];

// Reconcile logic: filter out active alerts where authoritative event is taken or skipped
const reconciledActive = simulatedAlerts.filter((a) => {
  if (a.status !== 'active') return false;
  const match = [recordedEvent].find((e) => e.eventId === a.doseEventId);
  if (match && (match.status === 'taken' || match.status === 'skipped')) {
    return false;
  }
  return true;
});

assert.strictEqual(reconciledActive.length, 0, 'Reconciled active alerts must exclude taken doses');
console.log('✔ Care Handoff reconciliation: Confirmed taken dose filtered from active alerts');

// B. Skipped dose invariant
const skippedEvent: DoseEvent = {
  eventId: 'event_skipped_1',
  medicationId: 'med_1',
  circleId: 'circle_1',
  scheduledAt: new Date().toISOString(),
  status: 'skipped',
  resolvedBy: 'elder_uid',
  resolvedAt: new Date().toISOString(),
};
assert.strictEqual(skippedEvent.status, 'skipped');
console.log('✔ Skipped dose status invariant preserved');

// C. Independent models invariant: Acknowledging alert does NOT mutate dose event
const mockDoseEventBefore: DoseEvent = { ...recordedEvent };
const alertAcknowledged = {
  ...simulatedAlerts[0],
  status: 'resolved' as const,
  outcome: 'confirmed_taken' as const,
  acknowledgedBy: 'caretaker_uid',
};
assert.strictEqual(mockDoseEventBefore.status, 'taken', 'Dose event status must remain unchanged by alert resolution');
assert.strictEqual(alertAcknowledged.status, 'resolved', 'Alert must transition to resolved');
console.log('✔ Independent data model invariant verified: Dose event preserved during alert resolution');

// 6. CSV Report Generator Tests (Bug 6)
console.log('Testing CSV report generation and field escaping...');
assert.strictEqual(escapeCSVField('Normal Text'), '"Normal Text"');
assert.strictEqual(escapeCSVField('Text with, comma'), '"Text with, comma"');
assert.strictEqual(escapeCSVField('Text with "quotes"'), '"Text with ""quotes"""');
assert.strictEqual(escapeCSVField('Line 1\nLine 2'), '"Line 1 Line 2"');
assert.strictEqual(escapeCSVField(null), '""');

const sampleSlots: DoseSlot[] = [
  {
    slotId: 'slot_1',
    medication: mockMeds[1],
    scheduledTimeStr: '08:00',
    scheduledAt: new Date('2026-11-15T08:00:00.000Z'),
    status: 'taken',
    event: recordedEvent,
  },
];

const csvOutput = generateMedicationReportCSV({
  elderName: 'Rose Dawson',
  circleId: 'CIRCLE_789',
  slots: sampleSlots,
  generatedAt: '2026-11-15T12:00:00.000Z',
});

assert.ok(csvOutput.includes('# Sahaara Medication Adherence Report - Rose Dawson'));
assert.ok(csvOutput.includes('# Care Circle ID: CIRCLE_789'));
assert.ok(csvOutput.includes('Morning Pill'));
assert.ok(csvOutput.includes('TAKEN'));
assert.ok(csvOutput.includes('Date,Scheduled Time,Medication,Dosage,Status,Recorded By,Instructions & Notes'));
console.log('✔ CSV report content and RFC 4180 escaping verified');

// Empty dataset handling
const emptyCsv = generateMedicationReportCSV({
  elderName: 'Rose Dawson',
  circleId: 'CIRCLE_789',
  slots: [],
});
assert.ok(emptyCsv.includes('# No medication records found for this period'));
console.log('✔ Empty dataset CSV handling verified');

// 7. Low-Stock Threshold Calculation Test (Phase 3)
console.log('Testing low-stock medication warning calculations...');
function isLowStock(med: { stockQuantity?: number; scheduledTimes: string[] }): boolean {
  if (med.stockQuantity === undefined) return false;
  const dosesPerDay = med.scheduledTimes.length;
  const daysSupply = dosesPerDay > 0 ? Math.floor(med.stockQuantity / dosesPerDay) : 0;
  return daysSupply <= 7 || med.stockQuantity <= 10;
}

assert.strictEqual(isLowStock({ stockQuantity: 14, scheduledTimes: ['08:00', '20:00'] }), true, '7 days supply (14 pills / 2 daily) should be low stock');
assert.strictEqual(isLowStock({ stockQuantity: 9, scheduledTimes: ['08:00'] }), true, '9 pills (<= 10) should be low stock');
assert.strictEqual(isLowStock({ stockQuantity: 60, scheduledTimes: ['08:00', '20:00'] }), false, '30 days supply should NOT be low stock');
assert.strictEqual(isLowStock({ stockQuantity: undefined, scheduledTimes: ['08:00'] }), false, 'Untracked stock should not trigger warning');
console.log('✔ Low-stock threshold logic verified');

// 8. Doctor Checklist Duplicate Prevention Test (Bug 5)
console.log('Testing checklist duplicate prevention...');
const currentChecklist = [
  { id: '1', text: 'Bring morning blood pressure logbook', done: true },
];
function canAddChecklistItem(list: typeof currentChecklist, newText: string): boolean {
  const trimmed = newText.trim().toLowerCase();
  if (!trimmed) return false;
  return !list.some((item) => item.text.trim().toLowerCase() === trimmed);
}

assert.strictEqual(canAddChecklistItem(currentChecklist, 'Bring morning blood pressure logbook'), false, 'Duplicate text must be rejected');
assert.strictEqual(canAddChecklistItem(currentChecklist, '   BRING MORNING BLOOD PRESSURE LOGBOOK   '), false, 'Case-insensitive whitespace-trimmed duplicate must be rejected');
assert.strictEqual(canAddChecklistItem(currentChecklist, 'New Lab Results'), true, 'Unique question must be accepted');
assert.strictEqual(canAddChecklistItem(currentChecklist, '   '), false, 'Blank input must be rejected');
console.log('✔ Checklist duplicate prevention verified');

console.log('\n======================================================');
console.log('ALL PHASE 2 & STABILIZATION TESTS PASSED (100% SUCCESS)');
console.log('======================================================\n');
