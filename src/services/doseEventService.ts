import {
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { DoseEvent, DoseSlot, DoseStatus, Medication, Role } from '../types';
import { recordCareActivity } from './activityService';

export function getDeterministicEventId(medicationId: string, scheduledAtISO: string): string {
  // Using deterministic key {medicationId}_{scheduledAtISO} to prevent duplicates
  const safeIso = scheduledAtISO.replace(/\//g, '-');
  return `${medicationId}_${safeIso}`;
}

export async function recordDoseEvent(params: {
  medicationId: string;
  circleId: string;
  scheduledAt: string; // ISO string
  status: DoseStatus;
  resolvedBy: string; // uid
  resolvedByName?: string;
  actorRole?: Role;
  medicationName?: string;
  notes?: string;
}): Promise<DoseEvent> {
  const eventId = getDeterministicEventId(params.medicationId, params.scheduledAt);
  const eventRef = doc(db, 'doseEvents', eventId);

  const eventData: DoseEvent = {
    eventId,
    medicationId: params.medicationId,
    circleId: params.circleId,
    scheduledAt: params.scheduledAt,
    status: params.status,
    resolvedBy: params.resolvedBy,
    resolvedAt: new Date().toISOString(),
    notes: params.notes || '',
  };

  // Upsert with deterministic ID - duplicate taps merge/update the single canonical record
  await setDoc(
    eventRef,
    {
      ...eventData,
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );

  // Record audit activity
  if (params.resolvedByName && params.actorRole) {
    const actionLabel =
      params.status === 'taken'
        ? 'Dose confirmed taken'
        : params.status === 'skipped'
        ? 'Dose marked skipped'
        : params.status === 'uncertain'
        ? 'Dose marked uncertain'
        : `Dose marked ${params.status}`;

    const medLabel = params.medicationName ? `for ${params.medicationName}` : '';
    const scheduledTime = new Date(params.scheduledAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    await recordCareActivity({
      circleId: params.circleId,
      type:
        params.status === 'taken'
          ? 'dose_taken'
          : params.status === 'skipped'
          ? 'dose_skipped'
          : 'dose_uncertain',
      actorId: params.resolvedBy,
      actorName: params.resolvedByName,
      actorRole: params.actorRole,
      details: `${actionLabel} ${medLabel} (${scheduledTime})${params.notes ? ` — "${params.notes}"` : ''}.`,
      metadata: { eventId, status: params.status, scheduledAt: params.scheduledAt },
    });
  }

  return eventData;
}

export function subscribeToTodayDoseEvents(
  circleId: string,
  onUpdate: (events: DoseEvent[]) => void,
  onError?: (err: Error) => void
): () => void {
  // Query by circleId to avoid composite-index preconditions and timezone boundary clipping
  const q = query(
    collection(db, 'doseEvents'),
    where('circleId', '==', circleId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const allEvents = snap.docs.map((d) => d.data() as DoseEvent);
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

      const todayEvents = allEvents.filter((ev) => {
        const time = new Date(ev.scheduledAt).getTime();
        return !isNaN(time) && time >= startOfDay && time <= endOfDay;
      });

      onUpdate(todayEvents);
    },
    (err) => {
      console.error('DoseEvents subscription error:', err);
      if (onError) onError(err);
    }
  );
}

export function computeTodaySlots(
  medications: Medication[],
  existingEvents: DoseEvent[]
): DoseSlot[] {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const todayYMD = now.toISOString().split('T')[0];

  const eventMap = new Map<string, DoseEvent>();
  existingEvents.forEach((ev) => {
    eventMap.set(ev.eventId, ev);
  });

  const slots: DoseSlot[] = [];

  medications
    .filter((med) => med.active)
    .forEach((med) => {
      // 1. Check startDate
      if (med.startDate && med.startDate > todayYMD) {
        return;
      }
      // 2. Check endDate
      if (med.endDate && med.endDate < todayYMD) {
        return;
      }
      // 3. Check daysOfWeek filter (if specified and not empty)
      if (med.daysOfWeek && med.daysOfWeek.length > 0) {
        if (!med.daysOfWeek.includes(currentDayOfWeek)) {
          return;
        }
      }

      med.scheduledTimes.forEach((timeStr) => {
        const [hourStr, minStr] = timeStr.split(':');
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minStr, 10);

        const slotDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hour,
          minute,
          0,
          0
        );
        const scheduledAtISO = slotDate.toISOString();
        const eventId = getDeterministicEventId(med.medicationId, scheduledAtISO);
        const event = eventMap.get(eventId);

        // Check if overdue: scheduled time was > 30 minutes ago and no explicit event recorded
        let status: DoseSlot['status'];
        if (event) {
          status = event.status;
        } else {
          const diffMs = now.getTime() - slotDate.getTime();
          const thirtyMinutesMs = 30 * 60 * 1000;
          if (diffMs > thirtyMinutesMs) {
            status = 'overdue';
          } else if (slotDate.getTime() > now.getTime()) {
            status = 'scheduled';
          } else {
            status = 'pending';
          }
        }

        slots.push({
          slotId: eventId,
          medication: med,
          scheduledAt: slotDate,
          scheduledTimeStr: timeStr,
          status,
          event,
        });
      });
    });

  // Sort chronologically by scheduled time
  slots.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  return slots;
}
