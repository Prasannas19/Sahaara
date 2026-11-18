export type Role = 'elder' | 'caretaker' | 'family';

export interface Circle {
  circleId: string;
  elderName: string;
  passcodeHash: string;
  // UID of the account that created the circle; only that account may hold
  // the elder role. Absent on circles created before this field existed.
  createdBy?: string;
  createdAt: string;
  backupCaretakerId?: string;
}

export interface Member {
  memberId: string;
  circleId: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: 'active' | 'invited';
  // Server-checked proof of passcode knowledge, written once at circle
  // create/join. Equals the circle's stored passcodeHash.
  joinProof?: string;
}

export type MealTiming = 'before_meal' | 'with_meal' | 'after_meal' | 'independent';
export type ScheduleFrequency = 'once_daily' | 'twice_daily' | 'thrice_daily' | 'selected_days' | 'custom';

export interface Medication {
  medicationId: string;
  circleId: string;
  name: string;
  dosage?: string; // e.g. "500 mg", "1 tablet"
  instructions: string;
  mealTiming?: MealTiming;
  frequency?: ScheduleFrequency;
  daysOfWeek?: number[]; // 0 = Sun, 1 = Mon ... 6 = Sat. If omitted, applies every day.
  scheduledTimes: string[]; // e.g. ["08:00", "13:00", "20:00"]
  startDate: string;
  endDate?: string;
  stockQuantity?: number;
  notes?: string;
  photoURL?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type DoseStatus = 'taken' | 'skipped' | 'uncertain' | 'overdue' | 'unconfirmed';

export interface DoseEvent {
  eventId: string; // {medicationId}_{scheduledAtISO}
  medicationId: string;
  circleId: string;
  scheduledAt: string; // ISO string
  status: DoseStatus;
  resolvedBy: string; // uid
  resolvedAt: string; // ISO string
  notes?: string;
}

export interface DoseSlot {
  slotId: string;
  medication: Medication;
  scheduledAt: Date;
  scheduledTimeStr: string;
  status: 'scheduled' | 'pending' | 'overdue' | DoseStatus;
  event?: DoseEvent;
}

export interface Appointment {
  appointmentId: string;
  circleId: string;
  title: string;
  doctorName: string;
  clinicOrHospital: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  purpose: string;
  notes?: string;
  preparationInstructions?: string;
  contactNumber?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  createdBy: string;
}

export type CareAlertOutcome =
  | 'confirmed_taken'
  | 'confirmed_skipped'
  | 'refused'
  | 'still_uncertain'
  | 'unable_to_contact';

export interface CareAlert {
  alertId: string;
  circleId: string;
  doseEventId: string;
  medicationId: string;
  medicationName: string;
  scheduledAt: string;
  elderName: string;
  primaryCaretakerId?: string;
  backupCaretakerId?: string;
  status: 'active' | 'acknowledged' | 'escalated' | 'resolved';
  outcome?: CareAlertOutcome;
  outcomeNotes?: string;
  acknowledgedBy?: string;
  acknowledgedByName?: string;
  acknowledgedAt?: string;
  escalatedAt?: string;
  escalationAttempts: number;
  createdAt: string;
}

export type ActivityType =
  | 'medication_created'
  | 'medication_updated'
  | 'medication_deactivated'
  | 'dose_taken'
  | 'dose_skipped'
  | 'dose_uncertain'
  | 'dose_overdue'
  | 'care_alert_created'
  | 'care_alert_acknowledged'
  | 'care_alert_escalated'
  | 'appointment_created'
  | 'appointment_updated'
  | 'appointment_cancelled'
  | 'appointment_completed';

export interface CareActivity {
  activityId: string;
  circleId: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  actorRole: Role | 'system';
  timestamp: string;
  details: string;
  metadata?: Record<string, unknown>;
}

export interface ContactInquiry {
  inquiryId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'new' | 'reviewed';
}

export interface ReminderLog {
  reminderId: string;
  circleId: string;
  type: 'medication_reminder' | 'overdue_alert' | 'appointment_reminder';
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: 'sent' | 'simulated_no_provider' | 'failed';
  details: string;
  sentAt: string;
}
