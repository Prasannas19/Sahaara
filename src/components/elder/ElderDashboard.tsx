import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Calendar,
  Pill,
  History,
  MapPin,
  User,
  Volume2,
  VolumeX,
  PhoneCall,
  ShieldCheck,
  AlertCircle,
  Users,
  Info,
} from 'lucide-react';
import type {
  Member,
  Circle,
  Medication,
  DoseEvent,
  DoseSlot,
  DoseStatus,
  Appointment,
  CareActivity,
} from '../../types';
import { subscribeToMedications } from '../../services/medicationService';
import {
  subscribeToTodayDoseEvents,
  computeTodaySlots,
  recordDoseEvent,
} from '../../services/doseEventService';
import { subscribeToAppointments } from '../../services/appointmentService';
import { subscribeToCareActivities } from '../../services/activityService';
import { subscribeToCircleMembers } from '../../services/circleService';
import { seedDemoCareRoutine } from '../../services/demoService';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { DigitalPillbox } from '../ui/DigitalPillbox';

export interface ElderDashboardProps {
  member: Member;
  circle: Circle | null;
}

type ElderTab = 'today' | 'medicines' | 'history' | 'appointments' | 'circle' | 'help' | 'privacy';

export const ElderDashboard: React.FC<ElderDashboardProps> = ({ member, circle }) => {
  const [activeTab, setActiveTab] = useState<ElderTab>('today');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseEvents, setDoseEvents] = useState<DoseEvent[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [circleMembers, setCircleMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<CareActivity[]>([]);
  const [medsLoading, setMedsLoading] = useState(true);
  const [apptsLoading, setApptsLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [helpSent, setHelpSent] = useState(false);

  useEffect(() => {
    if (!member.circleId) return;

    const unsubMeds = subscribeToMedications(member.circleId, (meds) => {
      setMedications(meds);
      setMedsLoading(false);
    });

    const unsubEvents = subscribeToTodayDoseEvents(member.circleId, (events) => {
      setDoseEvents(events);
    });

    const unsubAppts = subscribeToAppointments(member.circleId, (appts) => {
      setAppointments(appts.filter((a) => a.status === 'scheduled'));
      setApptsLoading(false);
    });

    const unsubActs = subscribeToCareActivities(member.circleId, (acts) => {
      setActivities(acts);
    }, 20);

    const unsubMembers = subscribeToCircleMembers(member.circleId, (mems) => {
      setCircleMembers(mems);
    });

    return () => {
      unsubMeds();
      unsubEvents();
      unsubAppts();
      unsubActs();
      unsubMembers();
    };
  }, [member.circleId]);

  const slots = computeTodaySlots(medications, doseEvents);
  // Next pending, scheduled, or overdue slot
  const nextActiveSlot = slots.find(
    (s) => s.status === 'pending' || s.status === 'scheduled' || s.status === 'overdue'
  );
  const takenCount = slots.filter((s) => s.status === 'taken').length;
  const progressPercent = slots.length > 0 ? Math.round((takenCount / slots.length) * 100) : 0;

  const handleRecordDose = async (slot: DoseSlot, status: DoseStatus) => {
    setActionLoading(slot.slotId);
    try {
      await recordDoseEvent({
        medicationId: slot.medication.medicationId,
        circleId: member.circleId,
        scheduledAt: slot.scheduledAt.toISOString(),
        status,
        resolvedBy: member.memberId,
        resolvedByName: member.name,
        actorRole: 'elder',
        medicationName: slot.medication.name,
      });

      const statusWord =
        status === 'taken'
          ? 'Taken'
          : status === 'skipped'
          ? 'Skipped'
          : 'marked as Not Sure';
      const msg = `Confirmed: ${slot.medication.name} scheduled for ${slot.scheduledTimeStr} has been recorded as ${statusWord}.`;
      setAnnouncement(msg);
    } catch (err) {
      console.error('Error logging dose:', err);
      setAnnouncement('Could not record medication status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSeedDemo = async () => {
    if (!member.circleId) return;
    setSeedingDemo(true);
    try {
      await seedDemoCareRoutine({
        circleId: member.circleId,
        elderName: circle?.elderName || member.name,
        caretakerId: member.memberId,
        caretakerName: member.name,
      });
      setAnnouncement('Demonstration care routine loaded successfully!');
    } catch (err) {
      console.error('Error seeding demo:', err);
      setAnnouncement('Could not load demo routine. Please try again.');
    } finally {
      setSeedingDemo(false);
    }
  };

  // Read-Aloud Accessibility Feature
  const handleToggleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      setAnnouncement('Text-to-speech is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const nextDoseText = nextActiveSlot
      ? `Your next medication due is ${nextActiveSlot.medication.name}, at ${nextActiveSlot.scheduledTimeStr}. ${
          nextActiveSlot.medication.instructions || ''
        }.`
      : 'All scheduled doses for today have been completed.';

    const fullSpeech = `Hello ${circle?.elderName || member.name}. You have completed ${takenCount} of ${
      slots.length
    } doses today. ${nextDoseText}`;

    const utterance = new SpeechSynthesisUtterance(fullSpeech);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const displayName = circle?.elderName || member.name;
  const primaryCaretaker = circleMembers.find((m) => m.role === 'caretaker');

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto text-left">
      {/* Screen reader live announcement region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* TOP GREETING & PROGRESS HERO */}
      <div className="bg-white/90 backdrop-blur-md rounded-[24px] p-6 sm:p-10 border border-[#DCE9DF] shadow-[0_4px_20px_rgba(23,63,53,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#EEF4EF] text-[#173F35] text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-[#173F35]" />
              <span>{todayFormatted}</span>
            </div>

            {/* Read Aloud Button */}
            <button
              type="button"
              onClick={handleToggleReadAloud}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-[#8F2D2D] text-white animate-pulse'
                  : 'bg-[#EEF4EF] hover:bg-[#DCE9DF] text-[#173F35] border border-[#DCE9DF]'
              }`}
              title="Click to have your schedule read out loud"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? 'Stop Reading' : 'Read Doses Aloud'}</span>
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#173F35] font-heading tracking-tight">
            Good day, {displayName}
          </h1>

          <p className="text-base sm:text-lg text-[#52605C] font-medium leading-relaxed max-w-xl">
            Here is your daily medication routine. Large buttons and clear guidance are here to support you.
          </p>
        </div>

        {/* Progress Tracker Widget */}
        <div className="bg-[#F8F7F1] rounded-[20px] p-6 border border-[#DCE9DF] flex flex-col items-center justify-center min-w-[220px] text-center shrink-0">
          <span className="text-xs uppercase font-extrabold text-[#52605C] tracking-wider">
            Today's Progress
          </span>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-[#173F35]">{takenCount}</span>
            <span className="text-lg font-bold text-[#52605C]">/ {slots.length} completed</span>
          </div>
          <div className="w-full bg-white h-3.5 rounded-full overflow-hidden border border-[#DCE9DF]">
            <div
              className="bg-[#173F35] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-[#52605C] mt-2">
            {slots.length === 0
              ? 'No medications due today'
              : progressPercent === 100
              ? 'All doses recorded for today!'
              : `${slots.length - takenCount} doses remaining`}
          </span>
        </div>
      </div>

      {/* VISUAL CONFIRMATION BANNER */}
      {announcement && (
        <div
          role="status"
          className="p-5 rounded-[16px] bg-[#DCE9DF] border-2 border-[#173F35] text-[#173F35] flex items-center justify-between shadow-xs transition-all animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#173F35] shrink-0" />
            <p className="text-base sm:text-lg font-bold">{announcement}</p>
          </div>
          <button
            onClick={() => setAnnouncement('')}
            className="text-xs font-bold px-3.5 py-2 rounded-[8px] bg-white text-[#173F35] hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SUB-NAVIGATION TABS (STAGE 2 SPECIFICATION) */}
      <nav
        aria-label="Elder dashboard navigation"
        className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#DCE9DF] scrollbar-none"
      >
        {[
          { id: 'today', label: 'Today & Progress', icon: Clock },
          { id: 'medicines', label: 'My Medicines', icon: Pill },
          { id: 'history', label: 'My Medication History', icon: History },
          { id: 'appointments', label: 'Appointments', icon: Calendar, count: appointments.length },
          { id: 'circle', label: 'Care Circle', icon: Users },
          { id: 'help', label: 'I Need Help', icon: HelpCircle },
          { id: 'privacy', label: 'My Privacy & Access', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ElderTab)}
              className={`flex items-center gap-2 px-4 py-3 rounded-[12px] font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#173F35] text-white shadow-sm'
                  : 'bg-white hover:bg-[#EEF4EF] text-[#25312E] border border-[#DCE9DF]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#DCE9DF]' : 'text-[#6C9B8B]'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white text-[#173F35]' : 'bg-[#EEF4EF] text-[#173F35]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* TAB 1: TODAY & DAILY PROGRESS */}
      {activeTab === 'today' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* DEMO ROUTINE HELPER BANNER (ALWAYS ACCESSIBLE, NEVER DISAPPEARS) */}
          <div className="p-4 rounded-[16px] bg-[#EEF4EF] border border-[#DCE9DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#173F35] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#173F35] uppercase tracking-wider">
                  Interactive Care Demonstration
                </p>
                <p className="text-xs text-[#52605C]">
                  Load or reset realistic prescriptions (Metformin, Amlodipine, Atorvastatin), Cardiology appointment, and Care Handoff alerts.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSeedDemo}
              disabled={seedingDemo}
              className="px-4 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#1f5246] text-white text-xs font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              {seedingDemo ? 'Loading Demo...' : 'Load / Reset Demo Routine'}
            </button>
          </div>

          {/* MAIN: NEXT MEDICATION DUE HERO */}
          <section aria-labelledby="next-dose-title" className="space-y-4">
            <h2 id="next-dose-title" className="text-2xl font-extrabold text-[#173F35] font-heading flex items-center gap-2.5">
              <Clock className="w-6 h-6 text-[#173F35]" />
              <span>Next Medication Due</span>
            </h2>

            {medsLoading ? (
              <Card className="text-center py-16">
                <p className="text-lg text-[#52605C]">Loading your medication schedule...</p>
              </Card>
            ) : !nextActiveSlot ? (
              <div className="p-8 sm:p-12 rounded-[24px] bg-white border-2 border-[#DCE9DF] text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-[20px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-[#173F35]" />
                </div>
                <h3 className="text-2xl font-bold text-[#173F35] font-heading">
                  {slots.length === 0 ? 'No Medications Scheduled Yet' : 'All Doses Completed For Today!'}
                </h3>
                <p className="text-sm text-[#52605C] max-w-md mx-auto leading-relaxed">
                  {slots.length === 0
                    ? 'Your Care Circle has not configured any active prescriptions yet. Click the button above to load demo medications.'
                    : 'Great job! You have taken or recorded all of your scheduled medications for today. Rest well.'}
                </p>
              </div>
            ) : (
              <div
                className={`p-6 sm:p-8 rounded-[24px] border-2 shadow-[0_4px_24px_rgba(23,63,53,0.08)] bg-white space-y-6 ${
                  nextActiveSlot.status === 'overdue'
                    ? 'border-[#E8B968] ring-4 ring-[#E8B968]/20'
                    : 'border-[#173F35]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[10px] bg-[#173F35] text-white text-sm font-bold">
                    <Clock className="w-4 h-4" />
                    <span>{nextActiveSlot.scheduledTimeStr} &middot; Scheduled Dose</span>
                  </div>
                  <StatusBadge status={nextActiveSlot.status} size="md" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-[#173F35] font-heading">
                    {nextActiveSlot.medication.name}
                  </h3>
                  <div className="inline-block px-3 py-1 rounded-[8px] bg-[#F8F7F1] border border-[#DCE9DF] text-sm font-bold text-[#52605C]">
                    Prescribed dose: {nextActiveSlot.medication.dosage || '1 dose'}
                  </div>
                </div>

                {nextActiveSlot.medication.instructions && (
                  <div className="p-4 rounded-[12px] bg-[#F8F7F1] border border-[#DCE9DF] space-y-1">
                    <span className="text-xs font-bold text-[#173F35] uppercase tracking-wider block">
                      Instructions
                    </span>
                    <p className="text-base text-[#25312E] font-medium leading-relaxed">
                      {nextActiveSlot.medication.instructions}
                    </p>
                  </div>
                )}

                {/* THREE LARGE ACCESSIBILITY ACTION KEYS (MINIMUM 56px HEIGHT) */}
                <div className="pt-2 space-y-3">
                  <p className="text-sm font-bold text-[#52605C]">
                    Please record your dose outcome:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => handleRecordDose(nextActiveSlot, 'taken')}
                      disabled={actionLoading === nextActiveSlot.slotId}
                      className="min-h-[58px] px-6 py-4 rounded-[16px] bg-[#173F35] hover:bg-[#1f5246] text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#173F35]/30 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-6 h-6 text-[#DCE9DF]" />
                      <span>{actionLoading === nextActiveSlot.slotId ? 'Recording...' : 'I Took It'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRecordDose(nextActiveSlot, 'skipped')}
                      disabled={actionLoading === nextActiveSlot.slotId}
                      className="min-h-[58px] px-6 py-4 rounded-[16px] bg-white hover:bg-[#F2ECEC] text-[#8F2D2D] border-2 border-[#8F2D2D]/40 font-extrabold text-base flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#8F2D2D]/20 disabled:opacity-50"
                    >
                      <XCircle className="w-6 h-6 text-[#8F2D2D]" />
                      <span>Skip Dose</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRecordDose(nextActiveSlot, 'uncertain')}
                      disabled={actionLoading === nextActiveSlot.slotId}
                      className="min-h-[58px] px-6 py-4 rounded-[16px] bg-white hover:bg-[#FDF7EB] text-[#875C0B] border-2 border-[#E8B968] font-extrabold text-base flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#E8B968]/30 disabled:opacity-50"
                    >
                      <HelpCircle className="w-6 h-6 text-[#E8B968]" />
                      <span>Not Sure</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* DIGITAL PILLBOX DIFFERENTIATOR */}
          <DigitalPillbox slots={slots} onTakeDose={(slot) => handleRecordDose(slot, 'taken')} />

          {/* TODAY'S FULL TIMELINE SCHEDULE */}
          <section aria-labelledby="today-timeline-title" className="space-y-4">
            <h2 id="today-timeline-title" className="text-xl font-extrabold text-[#173F35] font-heading flex items-center gap-2">
              <Pill className="w-5 h-5 text-[#173F35]" />
              <span>Full Daily Medication Timeline</span>
            </h2>

            <div className="space-y-3">
              {slots.map((slot) => {
                const isCurrent = nextActiveSlot?.slotId === slot.slotId;
                const isTaken = slot.status === 'taken';

                return (
                  <div
                    key={slot.slotId}
                    className={`p-5 rounded-[18px] bg-white border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isCurrent
                        ? 'border-2 border-[#173F35] shadow-sm'
                        : isTaken
                        ? 'border-[#DCE9DF] opacity-85'
                        : 'border-[#DCE9DF]'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-[14px] flex flex-col items-center justify-center shrink-0 border ${
                          isTaken
                            ? 'bg-[#EEF4EF] text-[#173F35] border-[#DCE9DF]'
                            : 'bg-[#F8F7F1] text-[#25312E] border-[#DCE9DF]'
                        }`}
                      >
                        <Clock className="w-4 h-4 text-[#6C9B8B]" />
                        <span className="text-xs font-extrabold mt-0.5">{slot.scheduledTimeStr}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-[#173F35] font-heading">
                            {slot.medication.name}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EEF4EF] text-[#173F35]">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#52605C]">
                          {slot.medication.dosage || 'Prescribed dose'} &middot;{' '}
                          {slot.medication.instructions || 'Follow prescription instructions'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <StatusBadge status={slot.status} size="md" />
                      {!isTaken && (
                        <button
                          type="button"
                          onClick={() => handleRecordDose(slot, 'taken')}
                          disabled={actionLoading === slot.slotId}
                          className="px-3.5 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#1f5246] text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Mark Taken
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: MY MEDICINES */}
      {activeTab === 'medicines' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE9DF]">
            <div>
              <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
                My Prescribed Medicines
              </h2>
              <p className="text-xs text-[#52605C]">
                Prescribed medications configured by your Care Circle. Read-only for elder safety.
              </p>
            </div>
            <span className="text-xs font-bold text-[#173F35] bg-[#EEF4EF] px-3 py-1.5 rounded-[8px] border border-[#DCE9DF]">
              {medications.length} active medicine{medications.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map((med) => (
              <div
                key={med.medicationId}
                className="p-6 rounded-[20px] bg-white border border-[#DCE9DF] shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#173F35] font-heading">{med.name}</h3>
                    <p className="text-xs font-bold text-[#6C9B8B] mt-0.5">{med.dosage || 'Prescribed'}</p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-[6px] font-bold ${
                      med.active ? 'bg-[#EEF4EF] text-[#173F35]' : 'bg-neutral-100 text-[#52605C]'
                    }`}
                  >
                    {med.active ? 'Active' : 'Paused'}
                  </span>
                </div>

                <div className="p-3.5 rounded-[12px] bg-[#F8F7F1] border border-[#DCE9DF] space-y-1 text-xs">
                  <span className="font-bold text-[#173F35] block">Instructions:</span>
                  <p className="text-[#25312E]">{med.instructions}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-[8px] bg-white border border-[#DCE9DF]">
                    <span className="text-[#52605C] block text-[11px]">Scheduled Times:</span>
                    <span className="font-bold text-[#173F35]">{med.scheduledTimes.join(', ')}</span>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-white border border-[#DCE9DF]">
                    <span className="text-[#52605C] block text-[11px]">Current Stock:</span>
                    <span className="font-bold text-[#173F35]">
                      {med.stockQuantity ? `${med.stockQuantity} tablets` : 'Unspecified'}
                    </span>
                  </div>
                </div>

                {med.notes && (
                  <p className="text-xs text-[#52605C] italic">Note: {med.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MY MEDICATION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-2 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              My Medication History
            </h2>
            <p className="text-xs text-[#52605C]">
              Previous recorded doses and verified confirmations for your Care Circle.
            </p>
          </div>

          {doseEvents.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-sm text-[#52605C]">No medication dose events recorded yet.</p>
            </Card>
          ) : (
            <div className="bg-white rounded-[20px] border border-[#DCE9DF] overflow-hidden shadow-xs">
              <div className="divide-y divide-[#DCE9DF]">
                {doseEvents.map((ev) => (
                  <div key={ev.eventId} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#173F35]">{ev.medicationId}</span>
                        <StatusBadge status={ev.status} size="sm" />
                      </div>
                      <p className="text-xs text-[#52605C]">
                        Scheduled: {new Date(ev.scheduledAt).toLocaleString()}
                      </p>
                      {ev.notes && <p className="text-xs text-[#25312E] italic">"{ev.notes}"</p>}
                    </div>

                    <div className="text-right text-xs text-[#52605C] shrink-0">
                      <span className="block font-medium">Recorded by {ev.resolvedBy}</span>
                      <span className="text-[11px]">
                        {new Date(ev.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RECENT CARE ACTIVITY SECTION */}
          {activities.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-lg font-bold text-[#173F35] font-heading">
                Recent Care Circle Activity
              </h3>
              <div className="bg-white rounded-[20px] border border-[#DCE9DF] p-4 shadow-xs space-y-2">
                {activities.map((act) => (
                  <div
                    key={act.activityId}
                    className="flex items-start justify-between py-2 border-b border-[#DCE9DF]/50 last:border-b-0 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#25312E]">{act.details}</p>
                      <p className="text-[11px] text-[#52605C]">
                        By {act.actorName} ({act.actorRole})
                      </p>
                    </div>
                    <span className="text-[11px] text-[#52605C] font-mono shrink-0 ml-4">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-2 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              Healthcare &amp; Doctor Appointments
            </h2>
            <p className="text-xs text-[#52605C]">
              Upcoming medical consultations and clinic visits scheduled with your Care Circle.
            </p>
          </div>

          {apptsLoading ? (
            <Card className="text-center py-12">
              <p className="text-sm text-[#52605C]">Loading your healthcare appointments...</p>
            </Card>
          ) : appointments.length === 0 ? (
            <Card className="text-center py-12 space-y-2">
              <Calendar className="w-8 h-8 text-[#6C9B8B] mx-auto" />
              <h3 className="text-lg font-bold text-[#173F35]">No Upcoming Appointments</h3>
              <p className="text-xs text-[#52605C] max-w-sm mx-auto">
                Your caretaker has not scheduled any upcoming clinic visits. You can load our demo routine to see a cardiology review.
              </p>
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
                    <span className="text-xs font-bold text-[#6C9B8B] uppercase tracking-wider">
                      {appt.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-[#173F35] font-heading">{appt.title}</h3>
                    <p className="text-sm font-semibold text-[#52605C] flex items-center gap-1.5 mt-0.5">
                      <User className="w-4 h-4 text-[#6C9B8B]" />
                      <span>{appt.doctorName} &middot; {appt.clinicOrHospital}</span>
                    </p>
                  </div>

                  {appt.location && (
                    <p className="text-xs text-[#52605C] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#52605C]" />
                      <span>{appt.location}</span>
                    </p>
                  )}

                  {appt.preparationInstructions && (
                    <div className="p-3.5 bg-[#F8F7F1] rounded-[10px] border border-[#DCE9DF] text-xs text-[#25312E] space-y-1">
                      <span className="font-bold text-[#173F35] block">What to bring:</span>
                      <p>{appt.preparationInstructions}</p>
                    </div>
                  )}

                  {appt.contactNumber && (
                    <p className="text-xs text-[#52605C] font-semibold">
                      Clinic Contact: {appt.contactNumber}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CARE CIRCLE */}
      {activeTab === 'circle' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-2 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              My Care Circle
            </h2>
            <p className="text-xs text-[#52605C]">
              Your authorised family members and caretakers who support your health.
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

      {/* TAB 6: I NEED HELP */}
      {activeTab === 'help' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-2 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              I Need Help
            </h2>
            <p className="text-xs text-[#52605C]">
              Quickly contact your primary caretaker or request assistance with your medicine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Caretaker Direct Call Card */}
            <div className="p-8 rounded-[24px] bg-white border-2 border-[#173F35] shadow-md space-y-5 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-[20px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center">
                <PhoneCall className="w-8 h-8 text-[#173F35]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-[#173F35] font-heading">
                  Call Primary Caretaker
                </h3>
                <p className="text-sm text-[#52605C]">
                  {primaryCaretaker ? `Connect with ${primaryCaretaker.name}` : 'Connect with your caretaker'}
                </p>
              </div>

              {primaryCaretaker?.phone ? (
                <a
                  href={`tel:${primaryCaretaker.phone}`}
                  className="w-full py-4 rounded-[16px] bg-[#173F35] hover:bg-[#1f5246] text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <PhoneCall className="w-5 h-5" />
                  <span>Call {primaryCaretaker.phone}</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setHelpSent(true);
                    setAnnouncement('Help request sent to your Care Circle!');
                  }}
                  className="w-full py-4 rounded-[16px] bg-[#173F35] hover:bg-[#1f5246] text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span>{helpSent ? 'Request Sent to Care Circle!' : 'Send Urgent Help Request'}</span>
                </button>
              )}
            </div>

            {/* Practical Care Guidance */}
            <div className="p-8 rounded-[24px] bg-[#F8F7F1] border border-[#DCE9DF] space-y-4">
              <h3 className="text-xl font-bold text-[#173F35] font-heading flex items-center gap-2">
                <Info className="w-5 h-5 text-[#6C9B8B]" />
                <span>What to do if you feel unwell</span>
              </h3>
              <ul className="space-y-3 text-sm text-[#25312E] list-disc list-inside">
                <li>If you missed a pill, tap "Skip Dose" or "Not Sure" and let your caretaker advise.</li>
                <li>Never take two pills at once without your doctor's explicit instructions.</li>
                <li>In a medical emergency, call your local ambulance or emergency number immediately.</li>
                <li>Your Care Circle receives notifications for any unconfirmed doses.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: MY PRIVACY & ACCESS */}
      {activeTab === 'privacy' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-2 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              My Privacy &amp; Data Access
            </h2>
            <p className="text-xs text-[#52605C]">
              Transparent information on how your healthcare data is protected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-[20px] bg-white border border-[#DCE9DF] shadow-xs space-y-3">
              <ShieldCheck className="w-8 h-8 text-[#173F35]" />
              <h3 className="text-lg font-bold text-[#173F35] font-heading">Circle Isolation</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                Your medical data is cryptographically scoped to Circle ID <code className="font-mono bg-[#EEF4EF] px-1 py-0.5 rounded">{member.circleId}</code>. No other circles can read your prescriptions.
              </p>
            </div>

            <div className="p-6 rounded-[20px] bg-white border border-[#DCE9DF] shadow-xs space-y-3">
              <Users className="w-8 h-8 text-[#6C9B8B]" />
              <h3 className="text-lg font-bold text-[#173F35] font-heading">Role Separation</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                Only authorised caretakers can edit prescriptions. Family viewers have read-only visibility to maintain safety.
              </p>
            </div>

            <div className="p-6 rounded-[20px] bg-white border border-[#DCE9DF] shadow-xs space-y-3">
              <History className="w-8 h-8 text-[#E8B968]" />
              <h3 className="text-lg font-bold text-[#173F35] font-heading">Immutable Audit Log</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                Every dose recorded, alert acknowledged, or appointment scheduled is logged with an unmodifiable timestamp and actor attribution.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
