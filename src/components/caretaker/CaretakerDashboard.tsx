import React, { useState, useEffect } from 'react';
import {
  Pill,
  Clock,
  Plus,
  Edit2,
  Trash2,
  History,
  Activity,
  Calendar,
  Sparkles,
  ShieldAlert,
  Eye,
  CheckCircle2,
  FileText,
  Download,
  CheckSquare,
  Users,
  Bell,
  AlertTriangle,
} from 'lucide-react';
import type {
  Member,
  Circle,
  Medication,
  DoseSlot,
  DoseStatus,
  MealTiming,
  ScheduleFrequency,
  Appointment,
  CareAlert,
  CareAlertOutcome,
  CareActivity,
  ReminderLog,
  DoseEvent,
} from '../../types';
import {
  subscribeToMedications,
  addMedication,
  updateMedication,
  deleteMedication,
} from '../../services/medicationService';
import {
  subscribeToTodayDoseEvents,
  computeTodaySlots,
  recordDoseEvent,
} from '../../services/doseEventService';
import {
  subscribeToCareAlerts,
  acknowledgeCareAlert,
  syncOverdueDoseAlerts,
} from '../../services/careHandoffService';
import {
  createAppointment,
  updateAppointment,
  deleteAppointment,
  subscribeToAppointments,
} from '../../services/appointmentService';
import { subscribeToCareActivities } from '../../services/activityService';
import { subscribeToReminderLogs } from '../../services/notificationService';
import { subscribeToCircleMembers } from '../../services/circleService';
import { seedDemoCareRoutine } from '../../services/demoService';
import { generateMedicationReportCSV, triggerCSVDownload } from '../../services/reportService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Input';
import { StatusBadge } from '../ui/StatusBadge';
import { ElderDashboard } from '../elder/ElderDashboard';
import { DigitalPillbox } from '../ui/DigitalPillbox';

export interface CaretakerDashboardProps {
  member: Member;
  circle: Circle | null;
}

type CaretakerTab =
  | 'overview'
  | 'handoff'
  | 'medications'
  | 'schedule'
  | 'monitoring'
  | 'appointments'
  | 'history'
  | 'circle'
  | 'reports'
  | 'notifications'
  | 'audit';

const DEFAULT_CHECKLIST_ITEMS = [
  { id: '1', text: 'Bring morning blood pressure & glycemic logbook', done: true },
  { id: '2', text: 'Review potential side effects with Dr. Sharma', done: false },
  { id: '3', text: 'Check if Metformin prescription needs refill renewal', done: false },
  { id: '4', text: 'Confirm upcoming laboratory ECG appointment date', done: false },
];

function getInitialChecklist(circleId?: string) {
  if (!circleId || typeof window === 'undefined') return DEFAULT_CHECKLIST_ITEMS;
  try {
    const stored = localStorage.getItem(`sahaara_doctor_checklist_${circleId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = [...parsed];
        for (const def of DEFAULT_CHECKLIST_ITEMS) {
          if (!merged.some((m) => m.text.toLowerCase() === def.text.toLowerCase())) {
            merged.unshift(def);
          }
        }
        return merged;
      }
    }
  } catch (e) {
    console.warn('Failed to load checklist from storage:', e);
  }
  return DEFAULT_CHECKLIST_ITEMS;
}

export const CaretakerDashboard: React.FC<CaretakerDashboardProps> = ({
  member,
  circle,
}) => {
  const [activeTab, setActiveTab] = useState<CaretakerTab>('overview');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseEvents, setDoseEvents] = useState<DoseEvent[]>([]);
  const [careAlerts, setCareAlerts] = useState<CareAlert[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<CareActivity[]>([]);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [circleMembers, setCircleMembers] = useState<Member[]>([]);
  const [apptsLoading, setApptsLoading] = useState(true);

  // Medication Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [previewElderOpen, setPreviewElderOpen] = useState(false);

  // Form states for Medication Add / Edit
  const [formName, setFormName] = useState('');
  const [formDosage, setFormDosage] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formMealTiming, setFormMealTiming] = useState<MealTiming>('independent');
  const [formFrequency, setFormFrequency] = useState<ScheduleFrequency>('once_daily');
  const [formDaysOfWeek, setFormDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [formTimes, setFormTimes] = useState<string[]>(['08:00']);
  const [newTimeInput, setNewTimeInput] = useState('');
  const [formStartDate, setFormStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [formEndDate, setFormEndDate] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Appointment Modal states
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [apptTitle, setApptTitle] = useState('');
  const [apptDoctor, setApptDoctor] = useState('');
  const [apptClinic, setApptClinic] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('10:00');
  const [apptLocation, setApptLocation] = useState('');
  const [apptPurpose, setApptPurpose] = useState('');
  const [apptPrep, setApptPrep] = useState('');
  const [apptPhone, setApptPhone] = useState('');
  const [apptSubmitting, setApptSubmitting] = useState(false);
  const [apptError, setApptError] = useState<string | null>(null);

  // Care Handoff Acknowledge Modal states
  const [selectedAlert, setSelectedAlert] = useState<CareAlert | null>(null);
  const [ackOutcome, setAckOutcome] = useState<CareAlertOutcome>('confirmed_taken');
  const [ackNotes, setAckNotes] = useState('');
  const [ackSubmitting, setAckSubmitting] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [medsLoading, setMedsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Doctor Visit Preparation Checklist
  const [checklistItems, setChecklistItems] = useState(() => getInitialChecklist(member.circleId));
  const [newChecklistText, setNewChecklistText] = useState('');

  const updateAndPersistChecklist = (items: typeof checklistItems) => {
    setChecklistItems(items);
    if (!member.circleId) return;
    try {
      localStorage.setItem(`sahaara_doctor_checklist_${member.circleId}`, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to persist checklist items:', err);
    }
  };

  // Filter for History
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!member.circleId) return;

    const unsubMeds = subscribeToMedications(member.circleId, (meds) => {
      setMedications(meds);
      setMedsLoading(false);
    });

    const unsubEvents = subscribeToTodayDoseEvents(member.circleId, (events) => {
      setDoseEvents(events);
      setEventsLoading(false);
    });

    const unsubAlerts = subscribeToCareAlerts(member.circleId, (alerts) => {
      setCareAlerts(alerts);
      setAlertsLoading(false);
    });

    const unsubAppts = subscribeToAppointments(member.circleId, (appts) => {
      setAppointments(appts);
      setApptsLoading(false);
    });

    const unsubActs = subscribeToCareActivities(member.circleId, (acts) => {
      setActivities(acts);
    }, 40);

    const unsubReminders = subscribeToReminderLogs(member.circleId, (logs) => {
      setReminderLogs(logs);
    });

    const unsubMembers = subscribeToCircleMembers(member.circleId, (mems) => {
      setCircleMembers(mems);
    });

    return () => {
      unsubMeds();
      unsubEvents();
      unsubAlerts();
      unsubAppts();
      unsubActs();
      unsubReminders();
      unsubMembers();
    };
  }, [member.circleId]);

  const slots = computeTodaySlots(medications, doseEvents);
  const takenCount = slots.filter((s) => s.status === 'taken').length;
  const pendingCount = slots.filter((s) => s.status === 'pending' || s.status === 'scheduled').length;
  const activeMedsCount = medications.filter((m) => m.active).length;

  // Reconcile Care Handoff alerts against authoritative dose events: Confirmed taken/skipped doses never stay active
  const activeAlerts = careAlerts.filter((a) => {
    if (a.status !== 'active' && a.status !== 'escalated') return false;
    const matchingEvent = doseEvents.find((e) => e.eventId === a.doseEventId);
    if (matchingEvent && (matchingEvent.status === 'taken' || matchingEvent.status === 'skipped')) {
      return false;
    }
    return true;
  });
  const resolvedAlerts = careAlerts.filter((a) => a.status === 'resolved');

  // Low stock warning calculation (< 7 days or <= 10 pills)
  const lowStockMeds = medications.filter((m) => {
    if (!m.active || m.stockQuantity === undefined) return false;
    const dosesPerDay = m.scheduledTimes.length;
    const daysSupply = dosesPerDay > 0 ? Math.floor(m.stockQuantity / dosesPerDay) : 0;
    return daysSupply <= 7 || m.stockQuantity <= 10;
  });

  // Automatic overdue alert synchronisation (accountable follow-up creation)
  // Gated: NEVER run while subscriptions are still loading initial data from Firestore
  useEffect(() => {
    if (medsLoading || eventsLoading || alertsLoading) return;
    if (!member.circleId || !circle || slots.length === 0) return;
    const elderName = circle.elderName || 'Elder';
    syncOverdueDoseAlerts({
      circleId: member.circleId,
      elderName,
      slots,
      primaryCaretakerId: member.memberId,
      existingAlerts: careAlerts,
    });
  }, [medsLoading, eventsLoading, alertsLoading, member.circleId, circle, slots, careAlerts, member.memberId]);

  const handleSeedDemo = async () => {
    if (!member.circleId) return;
    setSeedingDemo(true);
    try {
      await seedDemoCareRoutine({
        circleId: member.circleId,
        elderName: circle?.elderName || 'Elder',
        caretakerId: member.memberId,
        caretakerName: member.name,
      });
    } catch (err) {
      console.error('Failed to seed demo care routine:', err);
    } finally {
      setSeedingDemo(false);
    }
  };

  const openAddMedModal = () => {
    setEditingMed(null);
    setFormName('');
    setFormDosage('');
    setFormInstructions('');
    setFormMealTiming('independent');
    setFormFrequency('once_daily');
    setFormDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    setFormTimes(['08:00']);
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setFormStock('');
    setFormNotes('');
    setFormActive(true);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditMedModal = (med: Medication) => {
    setEditingMed(med);
    setFormName(med.name);
    setFormDosage(med.dosage || '');
    setFormInstructions(med.instructions);
    setFormMealTiming(med.mealTiming || 'independent');
    setFormFrequency(med.frequency || 'once_daily');
    setFormDaysOfWeek(med.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
    setFormTimes(med.scheduledTimes.length ? med.scheduledTimes : ['08:00']);
    setFormStartDate(med.startDate || new Date().toISOString().split('T')[0]);
    setFormEndDate(med.endDate || '');
    setFormStock(med.stockQuantity ? String(med.stockQuantity) : '');
    setFormNotes(med.notes || '');
    setFormActive(med.active);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Medication name is required.');
      return;
    }
    if (formTimes.length === 0) {
      setFormError('At least one scheduled dose time is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const stockVal = formStock.trim() ? parseInt(formStock, 10) : undefined;
      const medData = {
        name: formName.trim(),
        dosage: formDosage.trim(),
        instructions: formInstructions.trim(),
        mealTiming: formMealTiming,
        frequency: formFrequency,
        daysOfWeek: formDaysOfWeek,
        scheduledTimes: formTimes,
        startDate: formStartDate,
        endDate: formEndDate ? formEndDate : undefined,
        stockQuantity: isNaN(stockVal as number) ? undefined : stockVal,
        notes: formNotes.trim(),
        active: formActive,
      };

      if (editingMed) {
        await updateMedication(
          member.circleId,
          editingMed.medicationId,
          medData,
          { id: member.memberId, name: member.name, role: 'caretaker' }
        );
      } else {
        await addMedication(member.circleId, medData, {
          id: member.memberId,
          name: member.name,
          role: 'caretaker',
        });
      }

      setIsAddModalOpen(false);
    } catch (err: unknown) {
      console.error('Failed to save medication:', err);
      setFormError((err as Error).message || 'Failed to save medication. Check permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMedActive = async (med: Medication) => {
    try {
      await updateMedication(
        member.circleId,
        med.medicationId,
        { active: !med.active },
        { id: member.memberId, name: member.name, role: 'caretaker' }
      );
    } catch (err) {
      console.error('Failed to toggle medication state:', err);
    }
  };

  const handleDeleteMed = async (med: Medication) => {
    if (!window.confirm(`Are you sure you want to archive ${med.name}?`)) return;
    try {
      await deleteMedication(member.circleId, med.medicationId, med.name, {
        id: member.memberId,
        name: member.name,
        role: 'caretaker',
      });
    } catch (err) {
      console.error('Failed to delete medication:', err);
    }
  };

  const handleRefillStock = async (med: Medication, amount: number = 30) => {
    const current = med.stockQuantity || 0;
    try {
      await updateMedication(
        member.circleId,
        med.medicationId,
        { stockQuantity: current + amount },
        { id: member.memberId, name: member.name, role: 'caretaker' }
      );
    } catch (err) {
      console.error('Failed to refill medication stock:', err);
    }
  };

  // Appointment Handlers
  const openAddApptModal = () => {
    setApptTitle('');
    setApptDoctor('');
    setApptClinic('');
    setApptDate(new Date().toISOString().split('T')[0]);
    setApptTime('10:00');
    setApptLocation('');
    setApptPurpose('');
    setApptPrep('');
    setApptPhone('');
    setApptError(null);
    setIsApptModalOpen(true);
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptTitle.trim() || !apptDoctor.trim() || !apptDate || !apptTime) {
      setApptError('Title, doctor, date, and time are required.');
      return;
    }

    setApptSubmitting(true);
    setApptError(null);

    try {
      const apptData = {
        title: apptTitle.trim(),
        doctorName: apptDoctor.trim(),
        clinicOrHospital: apptClinic.trim(),
        date: apptDate,
        time: apptTime,
        location: apptLocation.trim(),
        purpose: apptPurpose.trim(),
        preparationInstructions: apptPrep.trim(),
        contactNumber: apptPhone.trim(),
        status: 'scheduled' as const,
      };

      await createAppointment(member.circleId, apptData, {
        id: member.memberId,
        name: member.name,
      });

      setIsApptModalOpen(false);
    } catch (err: unknown) {
      console.error('Failed to schedule appointment:', err);
      setApptError((err as Error).message || 'Failed to schedule appointment.');
    } finally {
      setApptSubmitting(false);
    }
  };

  const handleUpdateApptStatus = async (apptId: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      await updateAppointment(
        member.circleId,
        apptId,
        { status },
        { id: member.memberId, name: member.name }
      );
    } catch (err) {
      console.error('Failed to update appointment status:', err);
    }
  };

  const handleDeleteAppt = async (apptId: string) => {
    if (!window.confirm('Delete this appointment record?')) return;
    try {
      await deleteAppointment(member.circleId, apptId, {
        id: member.memberId,
        name: member.name,
      });
    } catch (err) {
      console.error('Failed to delete appointment:', err);
    }
  };

  // Care Handoff Handlers
  const handleAcknowledgeAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;

    setAckSubmitting(true);
    try {
      await acknowledgeCareAlert({
        circleId: member.circleId,
        alertId: selectedAlert.alertId,
        caretakerId: member.memberId,
        caretakerName: member.name,
        outcome: ackOutcome,
        notes: ackNotes.trim(),
      });
      setSelectedAlert(null);
      setAckNotes('');
    } catch (err) {
      console.error('Failed to acknowledge care alert:', err);
    } finally {
      setAckSubmitting(false);
    }
  };

  const handleCaretakerRecordDose = async (slot: DoseSlot, status: DoseStatus) => {
    try {
      await recordDoseEvent({
        medicationId: slot.medication.medicationId,
        circleId: member.circleId,
        scheduledAt: slot.scheduledAt.toISOString(),
        status,
        resolvedBy: member.memberId,
        resolvedByName: member.name,
        actorRole: 'caretaker',
        medicationName: slot.medication.name,
      });
    } catch (err) {
      console.error('Failed to record dose as caretaker:', err);
    }
  };

  // CSV Report Generator (Product Differentiator)
  const exportMedicationReportCSV = () => {
    const elderName = circle?.elderName || 'Elder';
    const circleId = member.circleId || 'N/A';
    const csvContent = generateMedicationReportCSV({
      elderName,
      circleId,
      slots,
    });
    const filename = `Sahaara_Report_${elderName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    triggerCSVDownload(filename, csvContent);
  };

  const toggleDayOfWeek = (day: number) => {
    if (formDaysOfWeek.includes(day)) {
      if (formDaysOfWeek.length > 1) {
        setFormDaysOfWeek(formDaysOfWeek.filter((d) => d !== day));
      }
    } else {
      setFormDaysOfWeek([...formDaysOfWeek, day].sort());
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-8 pb-16 text-left max-w-7xl mx-auto">
      {/* TOP CARETAKER WORKSPACE HEADER */}
      <div className="bg-white/90 backdrop-blur-md rounded-[24px] p-6 sm:p-8 border border-[#DCE9DF] shadow-[0_4px_20px_rgba(23,63,53,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold text-[#6C9B8B] tracking-wider">
              Caretaker Clinical Console &middot; Circle ID {member.circleId}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#173F35] font-heading mt-1">
            Care for {circle?.elderName || 'Elder'}
          </h1>
          <p className="text-sm text-[#52605C] mt-1 max-w-xl">
            Live adherence monitoring, prescription schedule configuration, Care Handoff follow-ups, and immutable audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="normal"
            onClick={handleSeedDemo}
            disabled={seedingDemo}
            className="flex items-center gap-2 font-bold text-xs border-[#173F35] text-[#173F35]"
          >
            <Sparkles className="w-4 h-4 text-[#173F35]" />
            <span>{seedingDemo ? 'Loading Demo...' : 'Load / Reset Demo'}</span>
          </Button>

          <Button
            variant="secondary"
            size="normal"
            onClick={() => setPreviewElderOpen(true)}
            className="flex items-center gap-2 font-bold text-xs"
          >
            <Eye className="w-4 h-4" />
            <span>Simulate Elder View</span>
          </Button>

          <Button
            variant="primary"
            size="normal"
            onClick={openAddMedModal}
            className="flex items-center gap-2 font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Prescription</span>
          </Button>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS (STAGE 2 11 APPROVED SECTIONS) */}
      <nav
        aria-label="Caretaker section tabs"
        className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#DCE9DF] scrollbar-none"
      >
        {[
          { id: 'overview', label: 'Overview & Summary', icon: Activity },
          { id: 'handoff', label: 'Care Handoff', icon: ShieldAlert, count: activeAlerts.length, alert: activeAlerts.length > 0 },
          { id: 'medications', label: 'Medication Management', icon: Pill, count: medications.length },
          { id: 'schedule', label: 'Schedule & Pillbox', icon: Clock },
          { id: 'monitoring', label: 'Dose Monitoring', icon: Eye },
          { id: 'appointments', label: 'Appointments', icon: Calendar, count: appointments.length },
          { id: 'history', label: 'Medication History', icon: History },
          { id: 'circle', label: 'Care Circle', icon: Users },
          { id: 'reports', label: 'Reports & Export', icon: FileText },
          { id: 'notifications', label: 'Notifications & Email', icon: Bell },
          { id: 'audit', label: 'Activity & Audit Log', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as CaretakerTab)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-[12px] font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#173F35] text-white shadow-sm'
                  : 'bg-white hover:bg-[#EEF4EF] text-[#25312E] border border-[#DCE9DF]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#DCE9DF]' : tab.alert ? 'text-[#9A3412]' : 'text-[#6C9B8B]'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-white text-[#173F35]'
                      : tab.alert
                      ? 'bg-[#FDF2E9] text-[#9A3412]'
                      : 'bg-[#EEF4EF] text-[#173F35]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ======================================================== */}
      {/* 1. OVERVIEW & ADHERENCE SUMMARY */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* METRIC OVERVIEW CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4 sm:p-5 border-l-4 border-l-[#173F35]">
              <span className="text-[11px] font-bold text-[#52605C] uppercase tracking-wider block">
                Today's Adherence
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#173F35]">
                  {slots.length > 0 ? Math.round((takenCount / slots.length) * 100) : 0}%
                </span>
                <span className="text-xs text-[#52605C]">
                  ({takenCount}/{slots.length} taken)
                </span>
              </div>
            </Card>

            <Card className="p-4 sm:p-5 border-l-4 border-l-[#9A3412]">
              <span className="text-[11px] font-bold text-[#9A3412] uppercase tracking-wider block">
                Care Follow-ups
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#9A3412]">{activeAlerts.length}</span>
                <span className="text-xs text-[#52605C]">action required</span>
              </div>
            </Card>

            <Card className="p-4 sm:p-5 border-l-4 border-l-[#6C9B8B]">
              <span className="text-[11px] font-bold text-[#52605C] uppercase tracking-wider block">
                Prescriptions
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#173F35]">{activeMedsCount}</span>
                <span className="text-xs text-[#52605C]">active meds</span>
              </div>
            </Card>

            <Card className="p-4 sm:p-5 border-l-4 border-l-[#E8B968]">
              <span className="text-[11px] font-bold text-[#875C0B] uppercase tracking-wider block">
                Pending / Due
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#875C0B]">{pendingCount}</span>
                <span className="text-xs text-[#52605C]">remaining today</span>
              </div>
            </Card>

            <Card className="p-4 sm:p-5 border-l-4 border-l-[#173F35]">
              <span className="text-[11px] font-bold text-[#52605C] uppercase tracking-wider block">
                Upcoming Visits
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#173F35]">{appointments.length}</span>
                <span className="text-xs text-[#52605C]">scheduled</span>
              </div>
            </Card>
          </div>

          {/* ACTIVE CARE HANDOFF BANNER (IF ANY) */}
          {activeAlerts.length > 0 && (
            <div className="p-6 rounded-[20px] bg-[#FDF2E9] border-2 border-[#FDBA74] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5 text-[#9A3412]">
                  <ShieldAlert className="w-6 h-6 shrink-0" />
                  <h3 className="text-lg font-bold font-heading">
                    {activeAlerts.length} Unconfirmed Care Follow-up{activeAlerts.length === 1 ? '' : 's'} Pending
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('handoff')}
                  className="px-4 py-2 rounded-[8px] bg-[#9A3412] text-white text-xs font-bold hover:bg-[#7c2d12] transition-colors cursor-pointer"
                >
                  Review &amp; Resolve Handoffs
                </button>
              </div>
              <p className="text-xs text-[#9A3412]/90">
                Scheduled doses were unconfirmed or flagged by the elder. In accordance with the Sahaara Care Handoff Protocol, accountable primary caretaker resolution is required.
              </p>
            </div>
          )}

          {/* LOW MEDICATION STOCK WARNING BANNER (IF ANY) */}
          {lowStockMeds.length > 0 && (
            <div className="p-5 rounded-[20px] bg-[#FFF8EE] border-2 border-[#E8B968] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-[#9A3412] shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[#9A3412]">
                    Low Stock Alert ({lowStockMeds.length} prescription{lowStockMeds.length === 1 ? '' : 's'} need refill)
                  </h4>
                  <p className="text-xs text-[#52605C] mt-0.5">
                    {lowStockMeds.map((m) => `${m.name}: ${m.stockQuantity} pills remaining`).join(' • ')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('medications')}
                className="px-3.5 py-2 rounded-[8px] bg-[#173F35] text-white text-xs font-bold hover:bg-[#1f5246] transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
              >
                View &amp; Refill
              </button>
            </div>
          )}

          {/* DIGITAL PILLBOX PREVIEW */}
          <DigitalPillbox slots={slots} onTakeDose={(slot) => handleCaretakerRecordDose(slot, 'taken')} />

          {/* SUMMARY SPLIT: TODAY'S DOSES & APPOINTMENTS PREVIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE9DF]">
                <h3 className="text-lg font-bold text-[#173F35] font-heading flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#173F35]" />
                  <span>Today's Dose Schedule</span>
                </h3>
                <button
                  onClick={() => setActiveTab('monitoring')}
                  className="text-xs font-bold text-[#173F35] hover:underline"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="space-y-2.5">
                {slots.slice(0, 4).map((slot) => (
                  <div
                    key={slot.slotId}
                    className="p-4 rounded-[14px] bg-white border border-[#DCE9DF] flex flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#173F35] flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#EEF4EF] text-[10px]">
                          {slot.scheduledTimeStr}
                        </span>
                        <span>{slot.medication.name}</span>
                      </div>
                      <p className="text-[11px] text-[#52605C] mt-0.5">{slot.medication.instructions}</p>
                    </div>
                    <StatusBadge status={slot.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE9DF]">
                <h3 className="text-lg font-bold text-[#173F35] font-heading flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#173F35]" />
                  <span>Upcoming Consultations</span>
                </h3>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="text-xs font-bold text-[#173F35] hover:underline"
                >
                  Manage Visits &rarr;
                </button>
              </div>

              {appointments.length === 0 ? (
                <Card className="text-center py-8">
                  <p className="text-xs text-[#52605C]">No upcoming doctor appointments scheduled.</p>
                </Card>
              ) : (
                appointments.slice(0, 2).map((appt) => (
                  <div
                    key={appt.appointmentId}
                    className="p-4 rounded-[14px] bg-white border border-[#DCE9DF] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#173F35]">{appt.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EEF4EF] text-[#173F35]">
                        {appt.date} at {appt.time}
                      </span>
                    </div>
                    <p className="text-xs text-[#52605C]">{appt.doctorName} &middot; {appt.clinicOrHospital}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CARE HANDOFF (CORE DIFFERENTIATOR — ALWAYS RENDERED) */}
      {/* ======================================================== */}
      {activeTab === 'handoff' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE9DF]">
            <div>
              <div className="flex items-center gap-2 text-[#9A3412]">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <h2 className="text-2xl font-extrabold font-heading text-[#9A3412]">
                  Care Handoff &middot; Accountable Follow-ups
                </h2>
              </div>
              <p className="text-xs text-[#52605C] mt-0.5">
                When doses pass 30 minutes overdue or are marked Not Sure, accountable tasks are generated for primary caretaker resolution.
              </p>
            </div>

            <span className="text-xs font-bold px-3 py-1.5 rounded-[8px] bg-[#FDF2E9] border border-[#FDBA74] text-[#9A3412]">
              {activeAlerts.length} Unresolved Alert{activeAlerts.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* ACTIVE ALERTS LIST */}
          {activeAlerts.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-[24px] bg-[#F9FCFA] border-2 border-[#6C9B8B]/40 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-[20px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center mx-auto border border-[#DCE9DF]">
                <CheckCircle2 className="w-8 h-8 text-[#173F35]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-[#173F35] font-heading">
                  All Care Handoffs Resolved
                </h3>
                <p className="text-sm text-[#52605C] max-w-lg mx-auto leading-relaxed">
                  No unconfirmed or overdue medication doses require caretaker follow-up at this time. Routine monitoring is active.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  variant="secondary"
                  size="normal"
                  onClick={handleSeedDemo}
                  disabled={seedingDemo}
                  className="text-xs font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  <span>Seed Demo Overdue Dose to Test Workflow</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => {
                const scheduledTime = new Date(alert.scheduledAt).getTime();
                const alertCreatedTime = new Date(alert.createdAt).getTime();
                const elapsedMs = Math.max(0, alertCreatedTime - scheduledTime);
                const elapsedMins = Math.floor(elapsedMs / (60 * 1000));
                const elapsedHours = Math.floor(elapsedMins / 60);
                const elapsedStr =
                  elapsedHours > 0
                    ? `${elapsedHours} hr ${elapsedMins % 60} min ago`
                    : `${elapsedMins} min ago`;

                return (
                  <div
                    key={alert.alertId}
                    className="p-6 rounded-[20px] bg-white border-2 border-[#FDBA74] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-[6px] bg-[#FDF2E9] text-[#9A3412] text-xs font-extrabold uppercase tracking-wider">
                          Unconfirmed Dose &middot; Overdue {elapsedStr}
                        </span>
                        <span className="text-xs text-[#52605C] font-mono">
                          Scheduled: {new Date(alert.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xl font-extrabold text-[#173F35]">
                          {alert.medicationName} for {alert.elderName}
                        </h4>
                        <p className="text-xs text-[#52605C]">
                          Assigned Caretaker: <span className="font-bold">{member.name}</span> (Primary)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Button
                        variant="primary"
                        size="normal"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setAckNotes('');
                        }}
                        className="font-bold text-xs bg-[#9A3412] hover:bg-[#7c2d12] border-none text-white shadow-xs"
                      >
                        Acknowledge &amp; Resolve Outcome
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* RESOLUTION AUDIT HISTORY */}
          {resolvedAlerts.length > 0 && (
            <div className="pt-6 space-y-3">
              <h3 className="text-lg font-bold text-[#173F35] font-heading">
                Resolved Care Handoff History
              </h3>
              <div className="bg-white rounded-[18px] border border-[#DCE9DF] overflow-hidden">
                <div className="divide-y divide-[#DCE9DF]">
                  {resolvedAlerts.map((res) => (
                    <div key={res.alertId} className="p-4 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="font-bold text-[#173F35]">{res.medicationName}</span>
                        <span className="text-[#52605C] ml-2">
                          Scheduled: {new Date(res.scheduledAt).toLocaleString()}
                        </span>
                        {res.outcomeNotes && (
                          <p className="text-[#52605C] mt-1 italic">Notes: "{res.outcomeNotes}"</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded bg-[#EEF4EF] text-[#173F35] font-bold uppercase text-[10px]">
                          {res.outcome || 'Resolved'}
                        </span>
                        <span className="block text-[11px] text-[#52605C] mt-0.5">
                          By {res.acknowledgedByName || 'Caretaker'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MEDICATION MANAGEMENT & STOCK TRACKING */}
      {/* ======================================================== */}
      {activeTab === 'medications' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE9DF]">
            <div>
              <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
                Medication Prescriptions &amp; Stock Tracker
              </h2>
              <p className="text-xs text-[#52605C]">
                Configure clinical dosages, dose frequencies, administration times, and inventory supply.
              </p>
            </div>

            <Button
              variant="primary"
              size="normal"
              onClick={openAddMedModal}
              className="text-xs font-bold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add New Prescription</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map((med) => {
              const dosesPerDay = med.scheduledTimes.length;
              const stock = med.stockQuantity || 0;
              const daysSupply = dosesPerDay > 0 ? Math.floor(stock / dosesPerDay) : 0;
              const isLowStock = stock > 0 && daysSupply <= 7;

              return (
                <div
                  key={med.medicationId}
                  className="p-6 rounded-[20px] bg-white border border-[#DCE9DF] shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[#173F35] font-heading">{med.name}</h3>
                      <p className="text-xs font-semibold text-[#6C9B8B] mt-0.5">
                        {med.dosage || 'Prescribed dose'}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-[6px] font-bold ${
                        med.active ? 'bg-[#EEF4EF] text-[#173F35]' : 'bg-neutral-100 text-[#52605C]'
                      }`}
                    >
                      {med.active ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <p className="text-xs text-[#25312E] bg-[#F8F7F1] p-3 rounded-[10px] border border-[#DCE9DF]">
                    {med.instructions}
                  </p>

                  {/* Stock & Refill Information */}
                  <div className="p-3.5 rounded-[12px] bg-[#EEF4EF]/50 border border-[#DCE9DF] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#52605C] uppercase block">
                        Supply &amp; Inventory
                      </span>
                      <span className="text-sm font-extrabold text-[#173F35]">
                        {med.stockQuantity !== undefined ? `${med.stockQuantity} pills` : 'Not tracked'}
                      </span>
                      {med.stockQuantity !== undefined && (
                        <span className="text-[11px] text-[#52605C] ml-1">
                          (~{daysSupply} days left)
                        </span>
                      )}
                      {isLowStock && (
                        <span className="block text-[10px] font-bold text-[#9A3412] mt-0.5">
                          ⚠️ Low stock warning
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRefillStock(med, 30)}
                      className="px-2.5 py-1.5 rounded-[6px] bg-white hover:bg-[#EEF4EF] text-[#173F35] text-xs font-bold border border-[#DCE9DF] cursor-pointer"
                    >
                      + Refill (+30)
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#DCE9DF] text-xs">
                    <span className="text-[#52605C]">Times: {med.scheduledTimes.join(', ')}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditMedModal(med)}
                        className="p-1.5 rounded hover:bg-[#EEF4EF] text-[#173F35] cursor-pointer"
                        title="Edit prescription"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleMedActive(med)}
                        className="px-2 py-1 rounded text-xs font-bold hover:bg-[#EEF4EF] text-[#52605C] cursor-pointer"
                      >
                        {med.active ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMed(med)}
                        className="p-1.5 rounded hover:bg-[#F2ECEC] text-[#8F2D2D] cursor-pointer"
                        title="Archive prescription"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SCHEDULE MANAGER & DIGITAL PILLBOX */}
      {/* ======================================================== */}
      {activeTab === 'schedule' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-3 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              Daily Schedule Manager &amp; Digital Pillbox
            </h2>
            <p className="text-xs text-[#52605C]">
              Visual 4-period medicine organiser for morning, afternoon, evening, and night dispensing.
            </p>
          </div>

          <DigitalPillbox slots={slots} onTakeDose={(slot) => handleCaretakerRecordDose(slot, 'taken')} />
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. DOSE MONITORING */}
      {/* ======================================================== */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-3 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              Real-Time Medication Dose Monitoring
            </h2>
            <p className="text-xs text-[#52605C]">
              Chronological status of all doses due today with recording attributions and timestamps.
            </p>
          </div>

          <div className="bg-white rounded-[20px] border border-[#DCE9DF] overflow-hidden shadow-xs">
            <div className="divide-y divide-[#DCE9DF]">
              {slots.map((slot) => (
                <div key={slot.slotId} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#EEF4EF] text-[#173F35] text-xs font-bold">
                        {slot.scheduledTimeStr}
                      </span>
                      <span className="font-bold text-sm text-[#173F35]">{slot.medication.name}</span>
                      <StatusBadge status={slot.status} size="sm" />
                    </div>
                    <p className="text-xs text-[#52605C]">
                      Prescribed: {slot.medication.dosage || '1 dose'} &middot; {slot.medication.instructions}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {slot.status !== 'taken' && (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleCaretakerRecordDose(slot, 'taken')}
                        className="text-xs font-bold"
                      >
                        Confirm Taken
                      </Button>
                    )}
                    {slot.status !== 'skipped' && (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleCaretakerRecordDose(slot, 'skipped')}
                        className="text-xs font-bold text-[#8F2D2D]"
                      >
                        Skip
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. APPOINTMENTS & DOCTOR VISIT CHECKLIST */}
      {/* ======================================================== */}
      {activeTab === 'appointments' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE9DF]">
            <div>
              <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
                Healthcare Appointments &amp; Doctor Visit Preparation
              </h2>
              <p className="text-xs text-[#52605C]">
                Schedule consultations and maintain a checklist for physician reviews.
              </p>
            </div>

            <Button
              variant="primary"
              size="normal"
              onClick={openAddApptModal}
              className="text-xs font-bold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Schedule New Visit</span>
            </Button>
          </div>

          {/* DOCTOR VISIT PREPARATION CHECKLIST DIFFERENTIATOR */}
          <div className="p-6 rounded-[20px] bg-[#F8F7F1] border border-[#DCE9DF] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#173F35]" />
                <h3 className="text-base font-bold text-[#173F35] font-heading">
                  Doctor Visit Preparation Checklist
                </h3>
              </div>
              <span className="text-xs text-[#52605C] font-semibold">
                {checklistItems.filter((i) => i.done).length} of {checklistItems.length} completed
              </span>
            </div>

            <div className="space-y-2">
              {checklistItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-[10px] bg-white border border-[#DCE9DF] cursor-pointer hover:bg-[#EEF4EF] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() =>
                      updateAndPersistChecklist(
                        checklistItems.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i))
                      )
                    }
                    className="w-4 h-4 rounded text-[#173F35] focus:ring-[#173F35]"
                  />
                  <span className={`text-xs font-medium ${item.done ? 'line-through text-[#52605C]' : 'text-[#173F35]'}`}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add custom question or item for doctor visit..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const trimmed = newChecklistText.trim();
                    if (!trimmed) return;
                    if (checklistItems.some((i) => i.text.toLowerCase() === trimmed.toLowerCase())) {
                      alert('This item already exists in your doctor checklist.');
                      return;
                    }
                    updateAndPersistChecklist([
                      ...checklistItems,
                      { id: `custom_${Date.now()}`, text: trimmed, done: false },
                    ]);
                    setNewChecklistText('');
                  }
                }}
                className="flex-1 px-3 py-2 rounded-[8px] bg-white border border-[#DCE9DF] text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = newChecklistText.trim();
                  if (!trimmed) return;
                  if (checklistItems.some((i) => i.text.toLowerCase() === trimmed.toLowerCase())) {
                    alert('This item already exists in your doctor checklist.');
                    return;
                  }
                  updateAndPersistChecklist([
                    ...checklistItems,
                    { id: `custom_${Date.now()}`, text: trimmed, done: false },
                  ]);
                  setNewChecklistText('');
                }}
                className="px-3.5 py-2 rounded-[8px] bg-[#173F35] text-white text-xs font-bold cursor-pointer"
              >
                Add Item
              </button>
            </div>
          </div>

          {/* APPOINTMENTS LIST */}
          {apptsLoading ? (
            <Card className="text-center py-12">
              <p className="text-sm text-[#52605C]">Loading scheduled healthcare visits...</p>
            </Card>
          ) : appointments.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-sm text-[#52605C]">No healthcare visits scheduled yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((appt) => (
                <div
                  key={appt.appointmentId}
                  className="p-6 rounded-[20px] bg-white border border-[#DCE9DF] shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#EEF4EF] text-[#173F35] text-xs font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{appt.date} at {appt.time}</span>
                    </span>
                    <span className="text-xs font-bold text-[#6C9B8B] uppercase">
                      {appt.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-[#173F35]">{appt.title}</h3>
                    <p className="text-xs text-[#52605C] mt-0.5">
                      {appt.doctorName} &middot; {appt.clinicOrHospital}
                    </p>
                  </div>

                  {appt.preparationInstructions && (
                    <div className="p-3 rounded-[8px] bg-[#F8F7F1] border border-[#DCE9DF] text-xs">
                      <span className="font-bold text-[#173F35] block">Prep Instructions:</span>
                      <p className="text-[#52605C]">{appt.preparationInstructions}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#DCE9DF] text-xs">
                    <span className="text-[#52605C]">{appt.location || 'Clinic'}</span>
                    <div className="flex items-center gap-2">
                      {appt.status === 'scheduled' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateApptStatus(appt.appointmentId, 'completed')}
                          className="px-2.5 py-1 rounded bg-[#EEF4EF] text-[#173F35] font-bold cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAppt(appt.appointmentId)}
                        className="p-1 rounded text-[#8F2D2D] hover:bg-[#F2ECEC] cursor-pointer"
                        title="Delete appointment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MEDICATION HISTORY */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE9DF]">
            <div>
              <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
                Medication Event History
              </h2>
              <p className="text-xs text-[#52605C]">
                Searchable historical records of all dose confirmations and outcome resolutions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={historyFilterStatus}
                onChange={(e) => setHistoryFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-[8px] bg-white border border-[#DCE9DF] text-xs font-bold"
              >
                <option value="all">All Outcomes</option>
                <option value="taken">Taken</option>
                <option value="skipped">Skipped</option>
                <option value="uncertain">Not Sure</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-[#DCE9DF] overflow-hidden shadow-xs">
            {doseEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#52605C]">
                No medication history recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-[#DCE9DF]">
                {doseEvents
                  .filter((ev) => (historyFilterStatus === 'all' ? true : ev.status === historyFilterStatus))
                  .map((ev) => (
                    <div key={ev.eventId} className="p-4 flex items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-[#173F35]">{ev.medicationId}</span>
                          <StatusBadge status={ev.status} size="sm" />
                        </div>
                        <p className="text-[#52605C]">
                          Scheduled: {new Date(ev.scheduledAt).toLocaleString()}
                        </p>
                        {ev.notes && <p className="italic text-[#25312E]">"{ev.notes}"</p>}
                      </div>

                      <div className="text-right text-[#52605C] shrink-0">
                        <span className="block font-medium">Recorded by {ev.resolvedBy}</span>
                        <span className="text-[11px]">
                          {new Date(ev.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. CARE CIRCLE & PERMISSIONS */}
      {/* ======================================================== */}
      {activeTab === 'circle' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-3 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              Care Circle Members &amp; Role Permissions
            </h2>
            <p className="text-xs text-[#52605C]">
              Authorised members belonging to Care Circle <code className="font-mono bg-[#EEF4EF] px-1.5 py-0.5 rounded text-[#173F35]">{member.circleId}</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {circleMembers.map((m) => (
              <div
                key={m.memberId}
                className="p-5 rounded-[18px] bg-white border border-[#DCE9DF] shadow-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#173F35] text-white flex items-center justify-center font-bold text-lg">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#173F35]">{m.name}</h3>
                    <p className="text-xs text-[#52605C]">{m.email}</p>
                    <p className="text-[11px] text-[#6C9B8B] font-mono mt-0.5">UID: {m.memberId}</p>
                  </div>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-[8px] font-bold uppercase tracking-wider ${
                    m.role === 'elder'
                      ? 'bg-[#173F35] text-white'
                      : m.role === 'caretaker'
                      ? 'bg-[#6C9B8B] text-white'
                      : 'bg-[#DCE9DF] text-[#173F35]'
                  }`}
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. REPORTS & CSV EXPORT */}
      {/* ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-3 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              Clinical Reports &amp; Medication Export
            </h2>
            <p className="text-xs text-[#52605C]">
              Download structured adherence records for sharing with consulting physicians.
            </p>
          </div>

          <div className="p-8 rounded-[24px] bg-white border border-[#DCE9DF] shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#173F35]">
                  Daily Adherence Report &middot; {circle?.elderName || 'Elder'}
                </h3>
                <p className="text-xs text-[#52605C] mt-1">
                  Includes scheduled dose times, recorded adherence statuses, notes, and caretaker timestamps.
                </p>
              </div>

              <Button
                variant="primary"
                size="normal"
                onClick={exportMedicationReportCSV}
                className="text-xs font-bold shrink-0"
              >
                <Download className="w-4 h-4 mr-1.5 shrink-0" />
                <span className="whitespace-nowrap">Export CSV Report</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#DCE9DF] text-xs">
              <div className="p-3 rounded-[10px] bg-[#F8F7F1]">
                <span className="text-[#52605C] block">Total Doses Tracked:</span>
                <span className="text-base font-extrabold text-[#173F35]">{slots.length}</span>
              </div>
              <div className="p-3 rounded-[10px] bg-[#F8F7F1]">
                <span className="text-[#52605C] block">Adherence Rate:</span>
                <span className="text-base font-extrabold text-[#173F35]">
                  {slots.length > 0 ? Math.round((takenCount / slots.length) * 100) : 0}%
                </span>
              </div>
              <div className="p-3 rounded-[10px] bg-[#F8F7F1]">
                <span className="text-[#52605C] block">Unresolved Handoffs:</span>
                <span className="text-base font-extrabold text-[#9A3412]">{activeAlerts.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. NOTIFICATIONS & EMAIL STATUS */}
      {/* ======================================================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-3 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              Automated Reminders &amp; Email Dispatch Logs
            </h2>
            <p className="text-xs text-[#52605C]">
              Transparent record of medication and appointment notification dispatches.
            </p>
          </div>

          <div className="p-4 rounded-[14px] bg-[#EEF4EF] border border-[#DCE9DF] text-xs text-[#173F35] space-y-1">
            <span className="font-bold block">Email Dispatch Architecture:</span>
            <p>
              Transactional notifications operate in in-app fallback mode by default. External SMTP providers (SendGrid, Postmark, AWS SES) connect to dispatch real emails without interrupting in-app care alerts.
            </p>
          </div>

          <div className="bg-white rounded-[20px] border border-[#DCE9DF] overflow-hidden shadow-xs">
            {reminderLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#52605C]">
                No automated reminders dispatched yet.
              </div>
            ) : (
              <div className="divide-y divide-[#DCE9DF]">
                {reminderLogs.map((log) => (
                  <div key={log.reminderId} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="font-bold text-[#173F35]">{log.subject}</span>
                      <p className="text-[#52605C] mt-0.5">{log.details}</p>
                      <p className="text-[11px] text-[#52605C]">Recipient: {log.recipientEmail}</p>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded bg-[#EEF4EF] text-[#173F35] font-bold text-[10px] uppercase">
                        {log.status}
                      </span>
                      <span className="block text-[11px] text-[#52605C] mt-0.5">
                        {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 11. ACTIVITY & AUDIT LOG (REPAIRED REAL-TIME LOG) */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-3 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              Immutable Care Activity &amp; Audit Trail
            </h2>
            <p className="text-xs text-[#52605C]">
              Cryptographically scoped append-only audit records for all care events in Circle {member.circleId}.
            </p>
          </div>

          <div className="bg-white rounded-[20px] border border-[#DCE9DF] overflow-hidden shadow-xs">
            {activities.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#52605C]">
                No recent activity recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-[#DCE9DF]">
                {activities.map((act) => (
                  <div key={act.activityId} className="p-4 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-[#25312E]">{act.details}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#52605C]">
                        <span>Actor: <strong className="text-[#173F35]">{act.actorName}</strong></span>
                        <span>&middot;</span>
                        <span className="capitalize px-1.5 py-0.2 rounded bg-[#EEF4EF] font-bold text-[10px] text-[#173F35]">
                          {act.actorRole}
                        </span>
                        <span>&middot;</span>
                        <span className="font-mono text-[10px]">Type: {act.type}</span>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-[#52605C] shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT MEDICATION PRESCRIPTION */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingMed ? 'Edit Prescription Schedule' : 'Add New Prescription'}
      >
        <form onSubmit={handleSaveMedication} className="space-y-4 text-left">
          {formError && (
            <div className="p-3 rounded-[8px] bg-[#F2ECEC] border border-[#8F2D2D]/30 text-[#8F2D2D] text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Medication Name"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Metformin, Lisinopril"
              required
            />

            <Input
              label="Dosage (strength & unit)"
              type="text"
              value={formDosage}
              onChange={(e) => setFormDosage(e.target.value)}
              placeholder="e.g. 500 mg, 1 tablet"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#25312E] block">
              Meal &amp; Administration Instructions
            </label>
            <textarea
              rows={2}
              value={formInstructions}
              onChange={(e) => setFormInstructions(e.target.value)}
              placeholder="e.g. Take with breakfast. Drink plenty of water."
              className="w-full px-3.5 py-2 rounded-[8px] bg-white border border-[#DCE9DF] focus:border-[#173F35] text-[#25312E] text-xs focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Meal Timing"
              value={formMealTiming}
              onChange={(e) => setFormMealTiming(e.target.value as MealTiming)}
              options={[
                { label: 'Independent of meals', value: 'independent' },
                { label: 'With meal', value: 'with_meal' },
                { label: 'Before meal (empty stomach)', value: 'before_meal' },
                { label: 'After meal', value: 'after_meal' },
              ]}
            />

            <Select
              label="Schedule Frequency"
              value={formFrequency}
              onChange={(e) => setFormFrequency(e.target.value as ScheduleFrequency)}
              options={[
                { label: 'Once daily', value: 'once_daily' },
                { label: 'Twice daily', value: 'twice_daily' },
                { label: 'Three times daily', value: 'thrice_daily' },
                { label: 'Selected days only', value: 'selected_days' },
                { label: 'Custom pattern', value: 'custom' },
              ]}
            />
          </div>

          {/* Days of Week Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#52605C] uppercase tracking-wider block">
              Active Days of the Week
            </label>
            <div className="flex items-center gap-1.5">
              {dayNames.map((name, idx) => {
                const isSelected = formDaysOfWeek.includes(idx);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleDayOfWeek(idx)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-[6px] border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#173F35] text-white border-[#173F35]'
                        : 'bg-white text-[#52605C] border-[#DCE9DF] hover:bg-[#EEF4EF]'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scheduled Times Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#52605C] uppercase tracking-wider block">
              Daily Dose Times (24-hour format)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {formTimes.map((time) => (
                <span
                  key={time}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#EEF4EF] text-[#173F35] font-mono font-bold text-xs"
                >
                  <span>{time}</span>
                  {formTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setFormTimes(formTimes.filter((t) => t !== time))}
                      className="text-neutral-400 hover:text-red-700 cursor-pointer ml-1"
                    >
                      &times;
                    </button>
                  )}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="time"
                value={newTimeInput}
                onChange={(e) => setNewTimeInput(e.target.value)}
                className="px-3 py-1.5 rounded-[8px] bg-white border border-[#DCE9DF] text-xs font-mono"
              />
              <Button
                type="button"
                variant="secondary"
                size="normal"
                onClick={() => {
                  if (newTimeInput && !formTimes.includes(newTimeInput)) {
                    setFormTimes([...formTimes, newTimeInput].sort());
                    setNewTimeInput('');
                  }
                }}
                className="text-xs font-bold py-1.5"
              >
                Add Time
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formStartDate}
              onChange={(e) => setFormStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date (optional)"
              type="date"
              value={formEndDate}
              onChange={(e) => setFormEndDate(e.target.value)}
            />
            <Input
              label="Current Stock Quantity"
              type="number"
              value={formStock}
              onChange={(e) => setFormStock(e.target.value)}
              placeholder="e.g. 60"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="med-active-toggle"
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#173F35] focus:ring-[#173F35]"
            />
            <label htmlFor="med-active-toggle" className="text-xs font-bold text-[#173F35] cursor-pointer">
              Schedule active in elder's routine
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#DCE9DF]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              disabled={submitting}
              className="text-xs font-bold px-6"
            >
              Save Prescription
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: SCHEDULE APPOINTMENT */}
      <Modal
        isOpen={isApptModalOpen}
        onClose={() => setIsApptModalOpen(false)}
        title="Schedule Healthcare Visit"
      >
        <form onSubmit={handleSaveAppointment} className="space-y-4 text-left">
          {apptError && (
            <div className="p-3 rounded-[8px] bg-[#F2ECEC] border border-[#8F2D2D]/30 text-[#8F2D2D] text-xs font-semibold">
              {apptError}
            </div>
          )}

          <Input
            label="Appointment Title"
            type="text"
            value={apptTitle}
            onChange={(e) => setApptTitle(e.target.value)}
            placeholder="e.g. Cardiology Follow-Up, Eye Exam"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Doctor / Provider Name"
              type="text"
              value={apptDoctor}
              onChange={(e) => setApptDoctor(e.target.value)}
              placeholder="e.g. Dr. Rajesh Sharma"
              required
            />
            <Input
              label="Clinic or Hospital"
              type="text"
              value={apptClinic}
              onChange={(e) => setApptClinic(e.target.value)}
              placeholder="e.g. Apollo Heart Center"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={apptDate}
              onChange={(e) => setApptDate(e.target.value)}
              required
            />
            <Input
              label="Time"
              type="time"
              value={apptTime}
              onChange={(e) => setApptTime(e.target.value)}
              required
            />
          </div>

          <Input
            label="Location / Room / Address"
            type="text"
            value={apptLocation}
            onChange={(e) => setApptLocation(e.target.value)}
            placeholder="e.g. 3rd Floor, Room 302"
          />

          <Input
            label="Purpose of Visit"
            type="text"
            value={apptPurpose}
            onChange={(e) => setApptPurpose(e.target.value)}
            placeholder="e.g. Blood pressure review & ECG"
          />

          <Input
            label="Preparation Instructions (optional)"
            type="text"
            value={apptPrep}
            onChange={(e) => setApptPrep(e.target.value)}
            placeholder="e.g. Fasting 8 hours prior"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-[#DCE9DF]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsApptModalOpen(false)}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={apptSubmitting}
              disabled={apptSubmitting}
              className="text-xs font-bold px-6"
            >
              Schedule Visit
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CARE HANDOFF ACKNOWLEDGEMENT */}
      {selectedAlert && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAlert(null)}
          title="Care Handoff Alert Acknowledged"
        >
          <form onSubmit={handleAcknowledgeAlert} className="space-y-4 text-left">
            <div className="p-4 rounded-[12px] bg-[#FDF2E9] border border-[#FDBA74] space-y-1">
              <span className="text-xs font-bold text-[#9A3412] uppercase tracking-wider block">
                Unconfirmed Medication Dose
              </span>
              <p className="text-base font-bold text-[#173F35]">
                {selectedAlert.medicationName} for {selectedAlert.elderName}
              </p>
              <p className="text-xs text-[#52605C]">
                Scheduled: {new Date(selectedAlert.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <Select
              label="Select Care Outcome"
              value={ackOutcome}
              onChange={(e) => setAckOutcome(e.target.value as CareAlertOutcome)}
              options={[
                { label: 'Confirmed Taken (verified with elder)', value: 'confirmed_taken' },
                { label: 'Confirmed Skipped (authorised skip)', value: 'confirmed_skipped' },
                { label: 'Refused by Elder (requires care review)', value: 'refused' },
                { label: 'Still Uncertain (will check again)', value: 'still_uncertain' },
                { label: 'Unable to Contact Elder', value: 'unable_to_contact' },
              ]}
            />

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#52605C] uppercase tracking-wider block">
                Care Notes / Reason (Optional)
              </label>
              <textarea
                rows={3}
                value={ackNotes}
                onChange={(e) => setAckNotes(e.target.value)}
                placeholder="e.g. Spoke to elder on phone; verified taking with lunch."
                className="w-full px-3 py-2 rounded-[8px] bg-white border border-[#DCE9DF] text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#DCE9DF]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedAlert(null)}
                className="text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={ackSubmitting}
                disabled={ackSubmitting}
                className="text-xs font-bold px-6 bg-[#9A3412] hover:bg-[#7c2d12] border-none text-white"
              >
                Submit Care Outcome
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: ELDER VIEW PREVIEW */}
      {previewElderOpen && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewElderOpen(false)}
          title={`Simulated Elder Dashboard: ${circle?.elderName || 'Elder'}`}
        >
          <div className="max-h-[75vh] overflow-y-auto p-2">
            <ElderDashboard member={member} circle={circle} />
          </div>
        </Modal>
      )}
    </div>
  );
};
