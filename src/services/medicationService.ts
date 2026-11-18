import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/db';
import type { Medication, Role } from '../types';
import { recordCareActivity } from './activityService';

function removeUndefined<T extends object>(obj: T): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      clean[k] = v;
    }
  }
  return clean;
}

export async function addMedication(
  circleId: string,
  data: Omit<Medication, 'medicationId' | 'circleId' | 'createdAt'>,
  actor?: { id: string; name: string; role: Role }
): Promise<Medication> {
  const medRef = doc(collection(db, 'medications'));
  const medicationId = medRef.id;

  const newMed: Medication = {
    ...data,
    medicationId,
    circleId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(medRef, {
    ...removeUndefined(newMed),
    createdAtServer: serverTimestamp(),
  });

  if (actor) {
    await recordCareActivity({
      circleId,
      type: 'medication_created',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: `Added new prescription: ${newMed.name} (${newMed.dosage || 'Prescribed dose'}, ${newMed.scheduledTimes.join(', ')}).`,
      metadata: { medicationId: newMed.medicationId },
    });
  }

  return newMed;
}

export async function updateMedication(
  circleId: string,
  medicationId: string,
  data: Partial<Omit<Medication, 'medicationId' | 'circleId' | 'createdAt'>>,
  actor?: { id: string; name: string; role: Role }
): Promise<void> {
  const medRef = doc(db, 'medications', medicationId);
  const now = new Date().toISOString();

  await updateDoc(medRef, {
    ...removeUndefined(data),
    updatedAt: now,
    updatedAtServer: serverTimestamp(),
  });

  if (actor) {
    const isDeactivation = data.active === false;
    await recordCareActivity({
      circleId,
      type: isDeactivation ? 'medication_deactivated' : 'medication_updated',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: isDeactivation
        ? `Deactivated medication schedule for ${data.name || 'medication'}.`
        : `Updated schedule instructions for ${data.name || 'medication'}.`,
      metadata: { medicationId, updates: data },
    });
  }
}

export async function deleteMedication(
  circleId: string,
  medicationId: string,
  medName: string,
  actor?: { id: string; name: string; role: Role }
): Promise<void> {
  const medRef = doc(db, 'medications', medicationId);
  await deleteDoc(medRef);

  if (actor) {
    await recordCareActivity({
      circleId,
      type: 'medication_deactivated',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: `Removed prescription record for ${medName}.`,
      metadata: { medicationId },
    });
  }
}

export async function getMedications(circleId: string): Promise<Medication[]> {
  const q = query(collection(db, 'medications'), where('circleId', '==', circleId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Medication);
}

export function subscribeToMedications(
  circleId: string,
  onUpdate: (medications: Medication[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, 'medications'), where('circleId', '==', circleId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Medication);
      onUpdate(list);
    },
    (err) => {
      console.error('Medications subscription error:', err);
      if (onError) onError(err);
    }
  );
}
