import assert from 'node:assert';
import { getDeterministicEventId, computeTodaySlots } from './doseEventService';
import type { Medication, DoseEvent } from '../types';

console.log('--- Running Sahaara Phase 2 Comprehensive Logic Checks ---');

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

console.log('--- ALL PHASE 2 LOGIC TESTS PASSED ---');
