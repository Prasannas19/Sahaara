import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { CareAlert, CareAlertOutcome, DoseSlot } from '../types';
import { recordCareActivity } from './activityService';

/**
 * Automatically detects overdue or uncertain medication doses and creates accountable
 * Care Handoff follow-up tasks in Firestore for primary caretaker resolution.
 * Completely idempotent: keyed by ${circleId}_${slotId}.
 */
export async function syncOverdueDoseAlerts(params: {
  circleId: string;
  elderName: string;
  slots: DoseSlot[];
  primaryCaretakerId?: string;
  existingAlerts?: CareAlert[];
}): Promise<CareAlert[]> {
  const { circleId, elderName, slots, primaryCaretakerId, existingAlerts = [] } = params;
  const existingMap = new Set(existingAlerts.map((a) => a.doseEventId));
  const createdAlerts: CareAlert[] = [];

  for (const slot of slots) {
    if (slot.status === 'overdue' || slot.status === 'uncertain') {
      // Confirmed taken or skipped doses must never become overdue alerts
      if (slot.event && (slot.event.status === 'taken' || slot.event.status === 'skipped')) {
        continue;
      }
      if (!existingMap.has(slot.slotId)) {
        try {
          const alert = await createCareAlert({
            circleId,
            doseEventId: slot.slotId,
            medicationId: slot.medication.medicationId,
            medicationName: slot.medication.name,
            scheduledAt: slot.scheduledAt.toISOString(),
            elderName,
            primaryCaretakerId,
          });
          if (alert) {
            createdAlerts.push(alert);
            existingMap.add(slot.slotId);
          }
        } catch (err) {
          console.error('Failed to auto-sync overdue care alert:', err);
        }
      }
    }
  }

  return createdAlerts;
}

export async function createCareAlert(params: {
  circleId: string;
  doseEventId: string;
  medicationId: string;
  medicationName: string;
  scheduledAt: string;
  elderName: string;
  primaryCaretakerId?: string;
  backupCaretakerId?: string;
}): Promise<CareAlert | null> {
  const alertId = `${params.circleId}_${params.doseEventId}`;
  const alertRef = doc(db, 'careAlerts', alertId);

  // 1. Reconcile with authoritative dose event: Confirmed taken/skipped doses NEVER trigger alerts
  try {
    const doseSnap = await getDoc(doc(db, 'doseEvents', params.doseEventId));
    if (doseSnap.exists()) {
      const doseData = doseSnap.data();
      if (doseData?.status === 'taken' || doseData?.status === 'skipped') {
        return null;
      }
    }
  } catch {
    // Expected when doseEvent document does not exist yet
  }

  // 2. Check if alert already exists in Firestore: Never recreate or overwrite existing/resolved alerts
  try {
    const alertSnap = await getDoc(alertRef);
    if (alertSnap.exists()) {
      return alertSnap.data() as CareAlert;
    }
  } catch {
    // Expected when alert document does not exist yet
  }

  const alertData: CareAlert = {
    alertId,
    circleId: params.circleId,
    doseEventId: params.doseEventId,
    medicationId: params.medicationId,
    medicationName: params.medicationName,
    scheduledAt: params.scheduledAt,
    elderName: params.elderName,
    primaryCaretakerId: params.primaryCaretakerId || '',
    backupCaretakerId: params.backupCaretakerId || '',
    status: 'active',
    escalationAttempts: 0,
    createdAt: new Date().toISOString(),
  };

  await setDoc(alertRef, {
    ...alertData,
    createdAtServer: serverTimestamp(),
  });

  await recordCareActivity({
    circleId: params.circleId,
    type: 'care_alert_created',
    actorId: 'system',
    actorName: 'Care Coordination Engine',
    actorRole: 'system',
    details: `Alert raised: ${params.elderName}'s ${params.medicationName} scheduled for ${new Date(params.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} is unconfirmed.`,
    metadata: { alertId, doseEventId: params.doseEventId },
  });

  return alertData;
}

export async function acknowledgeCareAlert(params: {
  circleId: string;
  alertId: string;
  caretakerId: string;
  caretakerName: string;
  outcome: CareAlertOutcome;
  notes?: string;
}): Promise<void> {
  const alertRef = doc(db, 'careAlerts', params.alertId);
  const now = new Date().toISOString();

  await updateDoc(alertRef, {
    status: 'resolved',
    outcome: params.outcome,
    outcomeNotes: params.notes || '',
    acknowledgedBy: params.caretakerId,
    acknowledgedByName: params.caretakerName,
    acknowledgedAt: now,
    updatedAtServer: serverTimestamp(),
  });

  const outcomeLabels: Record<CareAlertOutcome, string> = {
    confirmed_taken: 'Confirmed Taken',
    confirmed_skipped: 'Confirmed Skipped',
    refused: 'Refused by Elder',
    still_uncertain: 'Still Uncertain',
    unable_to_contact: 'Unable to Contact Elder',
  };

  await recordCareActivity({
    circleId: params.circleId,
    type: 'care_alert_acknowledged',
    actorId: params.caretakerId,
    actorName: params.caretakerName,
    actorRole: 'caretaker',
    details: `Care Handoff acknowledged by ${params.caretakerName}: [${outcomeLabels[params.outcome]}] ${params.notes ? `— "${params.notes}"` : ''}`,
    metadata: { alertId: params.alertId, outcome: params.outcome },
  });
}

export async function escalateCareAlert(params: {
  circleId: string;
  alertId: string;
  currentAttempts: number;
  backupCaretakerName?: string;
}): Promise<void> {
  const alertRef = doc(db, 'careAlerts', params.alertId);
  const now = new Date().toISOString();

  await updateDoc(alertRef, {
    status: 'escalated',
    escalatedAt: now,
    escalationAttempts: params.currentAttempts + 1,
    updatedAtServer: serverTimestamp(),
  });

  await recordCareActivity({
    circleId: params.circleId,
    type: 'care_alert_escalated',
    actorId: 'system',
    actorName: 'Escalation Protocol',
    actorRole: 'system',
    details: `Primary response window lapsed. Escalated alert to backup caretaker${params.backupCaretakerName ? ` (${params.backupCaretakerName})` : ''}.`,
    metadata: { alertId: params.alertId, attempts: params.currentAttempts + 1 },
  });
}

export function subscribeToCareAlerts(
  circleId: string,
  onUpdate: (alerts: CareAlert[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, 'careAlerts'), where('circleId', '==', circleId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as CareAlert);
      // Sort: active first, then by date descending
      list.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      onUpdate(list);
    },
    (err) => {
      console.error('CareAlerts subscription error:', err);
      if (onError) onError(err);
    }
  );
}
