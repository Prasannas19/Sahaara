import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { ReminderLog, DoseSlot, Appointment, Member } from '../types';
import { sendTransactionalEmail } from './emailService';

export async function sendDoseReminder(params: {
  circleId: string;
  slot: DoseSlot;
  recipient: Member;
  elderName: string;
}): Promise<ReminderLog | null> {
  const reminderId = `med_${params.slot.slotId}_${params.recipient.memberId}`;
  const logRef = doc(db, 'reminderLogs', reminderId);

  // Idempotency check: don't send duplicate reminders for the same slot to the same recipient
  const existingSnap = await getDoc(logRef);
  if (existingSnap.exists()) {
    return existingSnap.data() as ReminderLog;
  }

  const subject = `Sahaara Care Reminder: ${params.slot.medication.name} for ${params.elderName}`;
  const textBody = `Hello ${params.recipient.name},\n\nThis is a scheduled reminder that ${params.elderName} has a dose of ${params.slot.medication.name} scheduled for ${params.slot.scheduledTimeStr}.\nInstructions: ${params.slot.medication.instructions || 'As prescribed'}.\n\nVisit Sahaara to record or verify adherence: https://sahaara-5c835.web.app/dashboard`;

  const result = await sendTransactionalEmail({
    to: params.recipient.email,
    recipientName: params.recipient.name,
    subject,
    textBody,
    category: 'medication_reminder',
  });

  const logEntry: ReminderLog = {
    reminderId,
    circleId: params.circleId,
    type: 'medication_reminder',
    recipientEmail: params.recipient.email,
    recipientName: params.recipient.name,
    subject,
    status: result.status,
    details: `Dose reminder for ${params.slot.medication.name} at ${params.slot.scheduledTimeStr}`,
    sentAt: new Date().toISOString(),
  };

  await setDoc(logRef, {
    ...logEntry,
    createdAtServer: serverTimestamp(),
  });

  return logEntry;
}

export async function sendAppointmentReminder(params: {
  circleId: string;
  appointment: Appointment;
  recipient: Member;
  elderName: string;
}): Promise<ReminderLog | null> {
  const reminderId = `appt_${params.appointment.appointmentId}_${params.recipient.memberId}`;
  const logRef = doc(db, 'reminderLogs', reminderId);

  // Idempotency check
  const existingSnap = await getDoc(logRef);
  if (existingSnap.exists()) {
    return existingSnap.data() as ReminderLog;
  }

  const subject = `Sahaara Reminder: Upcoming Appointment with ${params.appointment.doctorName}`;
  const textBody = `Hello ${params.recipient.name},\n\nThis is a reminder that ${params.elderName} has an appointment scheduled:\n- Title: ${params.appointment.title}\n- Doctor/Provider: ${params.appointment.doctorName}\n- Clinic: ${params.appointment.clinicOrHospital}\n- Date & Time: ${params.appointment.date} at ${params.appointment.time}\n- Location: ${params.appointment.location}\n- Notes: ${params.appointment.notes || 'None'}\n\nView details: https://sahaara-5c835.web.app/dashboard`;

  const result = await sendTransactionalEmail({
    to: params.recipient.email,
    recipientName: params.recipient.name,
    subject,
    textBody,
    category: 'appointment_reminder',
  });

  const logEntry: ReminderLog = {
    reminderId,
    circleId: params.circleId,
    type: 'appointment_reminder',
    recipientEmail: params.recipient.email,
    recipientName: params.recipient.name,
    subject,
    status: result.status,
    details: `Appointment with ${params.appointment.doctorName} on ${params.appointment.date}`,
    sentAt: new Date().toISOString(),
  };

  await setDoc(logRef, {
    ...logEntry,
    createdAtServer: serverTimestamp(),
  });

  return logEntry;
}

export function subscribeToReminderLogs(
  circleId: string,
  onUpdate: (logs: ReminderLog[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, 'reminderLogs'), where('circleId', '==', circleId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as ReminderLog);
      list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      onUpdate(list);
    },
    (err) => {
      console.error('ReminderLogs subscription error:', err);
      if (onError) onError(err);
    }
  );
}
