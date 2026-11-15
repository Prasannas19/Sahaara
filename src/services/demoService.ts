import { addMedication, getMedications } from './medicationService';
import { createAppointment, getAppointments } from './appointmentService';
import { createCareAlert } from './careHandoffService';
import { recordCareActivity } from './activityService';

/**
 * Seeds a realistic demonstration care routine into the circle's Firestore collections.
 * Idempotent: checks for existing medications/appointments before creating, preventing duplicates.
 */
export async function seedDemoCareRoutine(params: {
  circleId: string;
  elderName: string;
  caretakerId: string;
  caretakerName: string;
}): Promise<void> {
  const { circleId, elderName, caretakerId, caretakerName } = params;
  const todayYMD = new Date().toISOString().split('T')[0];

  const existingMeds = await getMedications(circleId);
  let medMetformin = existingMeds.find((m) => m.name.toLowerCase().includes('metformin'));
  const medAmlodipine = existingMeds.find((m) => m.name.toLowerCase().includes('amlodipine'));
  const medAtorvastatin = existingMeds.find((m) => m.name.toLowerCase().includes('atorvastatin'));

  // 1. Add Metformin 500mg (Twice daily with meals) if not present
  if (!medMetformin) {
    medMetformin = await addMedication(
      circleId,
      {
        name: 'Metformin 500mg',
        dosage: '500 mg (1 tablet)',
        instructions: 'Take 1 tablet with breakfast and dinner with water',
        mealTiming: 'with_meal',
        frequency: 'twice_daily',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        scheduledTimes: ['08:00', '20:00'],
        startDate: todayYMD,
        stockQuantity: 60,
        notes: 'Prescribed by Dr. Rajesh Sharma for glycemic control',
        active: true,
      },
      { id: caretakerId, name: caretakerName, role: 'caretaker' }
    );
  }

  // 2. Add Amlodipine 5mg (Once daily morning) if not present
  if (!medAmlodipine) {
    await addMedication(
      circleId,
      {
        name: 'Amlodipine 5mg',
        dosage: '5 mg (1 tablet)',
        instructions: 'Take 1 tablet every morning for blood pressure',
        mealTiming: 'independent',
        frequency: 'once_daily',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        scheduledTimes: ['09:00'],
        startDate: todayYMD,
        stockQuantity: 30,
        notes: 'Blood pressure maintenance',
        active: true,
      },
      { id: caretakerId, name: caretakerName, role: 'caretaker' }
    );
  }

  // 3. Add Atorvastatin 20mg (Once daily bedtime) if not present
  if (!medAtorvastatin) {
    await addMedication(
      circleId,
      {
        name: 'Atorvastatin 20mg',
        dosage: '20 mg (1 tablet)',
        instructions: 'Take 1 tablet at night before sleeping',
        mealTiming: 'after_meal',
        frequency: 'once_daily',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        scheduledTimes: ['21:30'],
        startDate: todayYMD,
        stockQuantity: 30,
        notes: 'Lipid / cholesterol control',
        active: true,
      },
      { id: caretakerId, name: caretakerName, role: 'caretaker' }
    );
  }

  // 4. Create an accountable Care Follow-up alert for earlier unconfirmed dose
  const slotIso = `${todayYMD}T08:00:00.000Z`;
  const doseEventId = `${medMetformin.medicationId}_${slotIso.replace(/\//g, '-')}`;

  await createCareAlert({
    circleId,
    doseEventId,
    medicationId: medMetformin.medicationId,
    medicationName: 'Metformin 500mg',
    scheduledAt: slotIso,
    elderName,
    primaryCaretakerId: caretakerId,
  });

  // 5. Schedule an upcoming doctor consultation if not present
  const existingAppts = await getAppointments(circleId);
  const apptFound = existingAppts.some((a) => a.title.toLowerCase().includes('cardiology'));

  if (!apptFound) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    const apptDateStr = nextWeek.toISOString().split('T')[0];

    await createAppointment(
      circleId,
      {
        title: 'Cardiology Review & ECG',
        doctorName: 'Dr. Rajesh Sharma',
        clinicOrHospital: 'City Heart Institute',
        date: apptDateStr,
        time: '10:30',
        location: '3rd Floor, Consultation Room 304',
        purpose: 'Quarterly cardiovascular review and blood pressure check',
        preparationInstructions: 'Bring morning blood pressure log and current prescription bottles',
        contactNumber: '+91 98200 12345',
        status: 'scheduled',
      },
      { id: caretakerId, name: caretakerName }
    );
  }

  // 6. Record care activities
  await recordCareActivity({
    circleId,
    type: 'care_alert_created',
    actorId: caretakerId,
    actorName: caretakerName,
    actorRole: 'caretaker',
    details: `Demonstration Care Routine loaded: Daily prescriptions, Care Handoff follow-up for Metformin, and Cardiology consultation verified.`,
    metadata: { demoSeeded: true },
  });
}
