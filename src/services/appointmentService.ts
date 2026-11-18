import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/db';
import type { Appointment } from '../types';
import { recordCareActivity } from './activityService';

export async function createAppointment(
  circleId: string,
  data: Omit<Appointment, 'appointmentId' | 'circleId' | 'createdAt' | 'createdBy'>,
  actor: { id: string; name: string }
): Promise<Appointment> {
  const ref = doc(collection(db, 'appointments'));
  const appointmentId = ref.id;

  const appt: Appointment = {
    ...data,
    notes: data.notes || '',
    preparationInstructions: data.preparationInstructions || '',
    contactNumber: data.contactNumber || '',
    appointmentId,
    circleId,
    createdAt: new Date().toISOString(),
    createdBy: actor.id,
  };

  await setDoc(ref, {
    ...appt,
    createdAtServer: serverTimestamp(),
  });

  await recordCareActivity({
    circleId,
    type: 'appointment_created',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: 'caretaker',
    details: `Scheduled ${appt.title} with ${appt.doctorName} on ${appt.date} at ${appt.time}.`,
    metadata: { appointmentId },
  });

  return appt;
}

export async function updateAppointment(
  circleId: string,
  appointmentId: string,
  updates: Partial<Appointment>,
  actor: { id: string; name: string }
): Promise<void> {
  const ref = doc(db, 'appointments', appointmentId);
  await updateDoc(ref, {
    ...updates,
    updatedAtServer: serverTimestamp(),
  });

  let activityType: 'appointment_updated' | 'appointment_cancelled' | 'appointment_completed' =
    'appointment_updated';
  let detailMsg = `Updated appointment details.`;

  if (updates.status === 'completed') {
    activityType = 'appointment_completed';
    detailMsg = `Marked appointment as completed.`;
  } else if (updates.status === 'cancelled') {
    activityType = 'appointment_cancelled';
    detailMsg = `Cancelled scheduled appointment.`;
  }

  await recordCareActivity({
    circleId,
    type: activityType,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: 'caretaker',
    details: detailMsg,
    metadata: { appointmentId, updates },
  });
}

export async function deleteAppointment(
  circleId: string,
  appointmentId: string,
  actor: { id: string; name: string }
): Promise<void> {
  const ref = doc(db, 'appointments', appointmentId);
  await deleteDoc(ref);

  await recordCareActivity({
    circleId,
    type: 'appointment_cancelled',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: 'caretaker',
    details: `Removed appointment record.`,
    metadata: { appointmentId },
  });
}

export async function getAppointments(circleId: string): Promise<Appointment[]> {
  const q = query(collection(db, 'appointments'), where('circleId', '==', circleId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => d.data() as Appointment);
  list.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
    const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
    return dateA.getTime() - dateB.getTime();
  });
  return list;
}

export function subscribeToAppointments(
  circleId: string,
  onUpdate: (appointments: Appointment[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, 'appointments'), where('circleId', '==', circleId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Appointment);
      // Sort chronologically by date and time
      list.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateA.getTime() - dateB.getTime();
      });
      onUpdate(list);
    },
    (err) => {
      console.error('Appointments subscription error:', err);
      if (onError) onError(err);
    }
  );
}
