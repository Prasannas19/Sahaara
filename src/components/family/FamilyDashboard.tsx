import React, { useState, useEffect } from 'react';
import { Pill, Clock, Eye, Heart, Calendar, Activity, MapPin, ShieldAlert, History } from 'lucide-react';
import type { Member, Circle, Medication, DoseEvent, Appointment, CareActivity, CareAlert } from '../../types';
import { subscribeToMedications } from '../../services/medicationService';
import {
  subscribeToTodayDoseEvents,
  computeTodaySlots,
} from '../../services/doseEventService';
import { subscribeToAppointments } from '../../services/appointmentService';
import { subscribeToCareActivities } from '../../services/activityService';
import { subscribeToCareAlerts } from '../../services/careHandoffService';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { DigitalPillbox } from '../ui/DigitalPillbox';

export interface FamilyDashboardProps {
  member: Member;
  circle: Circle | null;
}

type FamilyTab = 'overview' | 'timeline' | 'appointments' | 'alerts' | 'history';

export const FamilyDashboard: React.FC<FamilyDashboardProps> = ({
  member,
  circle,
}) => {
  const [activeTab, setActiveTab] = useState<FamilyTab>('overview');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseEvents, setDoseEvents] = useState<DoseEvent[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<CareActivity[]>([]);
  const [careAlerts, setCareAlerts] = useState<CareAlert[]>([]);
  const [apptsLoading, setApptsLoading] = useState(true);

  useEffect(() => {
    if (!member.circleId) return;

    const unsubMeds = subscribeToMedications(member.circleId, (meds) => {
      setMedications(meds);
    });

    const unsubEvents = subscribeToTodayDoseEvents(member.circleId, (events) => {
      setDoseEvents(events);
    });

    const unsubAppts = subscribeToAppointments(member.circleId, (appts) => {
      setAppointments(appts);
      setApptsLoading(false);
    });

    const unsubActs = subscribeToCareActivities(member.circleId, (acts) => {
      setActivities(acts);
    }, 30);

    const unsubAlerts = subscribeToCareAlerts(member.circleId, (alerts) => {
      setCareAlerts(alerts);
    });

    return () => {
      unsubMeds();
      unsubEvents();
      unsubAppts();
      unsubActs();
      unsubAlerts();
    };
  }, [member.circleId]);

  const slots = computeTodaySlots(medications, doseEvents);
  const takenCount = slots.filter((s) => s.status === 'taken').length;
  const progressPercent = slots.length > 0 ? Math.round((takenCount / slots.length) * 100) : 0;
  const activeAlerts = careAlerts.filter((a) => a.status === 'active' || a.status === 'escalated');

  return (
    <div className="space-y-8 pb-16 text-left max-w-6xl mx-auto">
      {/* FAMILY OVERVIEW BANNER */}
      <div className="bg-white/90 backdrop-blur-md rounded-[24px] p-6 sm:p-8 border border-[#DCE9DF] shadow-[0_4px_20px_rgba(23,63,53,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-[16px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center shrink-0 border border-[#DCE9DF]">
            <Heart className="w-8 h-8 text-[#173F35]" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173F35] font-heading">
                {circle?.elderName || 'Elder Family Member'}
              </h1>
              <span className="text-xs bg-[#DCE9DF] text-[#173F35] font-bold px-3 py-1 rounded-[6px] flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Family View (Strict Read-Only)</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#52605C]">
              Signed in as <strong>{member.name}</strong> &middot; Scoped Circle ID:{' '}
              <code className="bg-[#EEF4EF] px-1.5 py-0.5 rounded font-mono text-xs">{circle?.circleId}</code>
            </p>
          </div>
        </div>

        {/* Daily Completion Summary */}
        <div className="bg-[#EEF4EF] rounded-[20px] p-5 border border-[#DCE9DF] flex flex-col items-center justify-center min-w-[200px] text-center shrink-0">
          <span className="text-xs uppercase font-extrabold text-[#52605C] tracking-wider">
            Today's Adherence
          </span>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-[#173F35]">{takenCount}</span>
            <span className="text-base font-bold text-[#52605C]">/ {slots.length} Taken</span>
          </div>
          <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-[#DCE9DF]">
            <div
              className="bg-[#173F35] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS (STAGE 2 5 APPROVED SECTIONS) */}
      <nav
        aria-label="Family dashboard tabs"
        className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#DCE9DF] scrollbar-none"
      >
        {[
          { id: 'overview', label: 'Family Overview', icon: Eye },
          { id: 'timeline', label: 'Care Timeline', icon: Activity, count: activities.length },
          { id: 'appointments', label: 'Upcoming Appointments', icon: Calendar, count: appointments.length },
          { id: 'alerts', label: 'Alerts & Follow-ups', icon: ShieldAlert, count: activeAlerts.length, alert: activeAlerts.length > 0 },
          { id: 'history', label: 'Medication History', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as FamilyTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#173F35] text-white shadow-sm'
                  : 'bg-white hover:bg-[#EEF4EF] text-[#25312E] border border-[#DCE9DF]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#DCE9DF]' : tab.alert ? 'text-[#9A3412]' : 'text-[#6C9B8B]'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white text-[#173F35]' : tab.alert ? 'bg-[#FDF2E9] text-[#9A3412]' : 'bg-[#EEF4EF] text-[#173F35]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* TAB 1: FAMILY OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <DigitalPillbox slots={slots} readOnly={true} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Today's Schedule */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE9DF]">
                <h3 className="text-lg font-bold text-[#173F35] font-heading flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#173F35]" />
                  <span>Today's Schedule &amp; Recorded Outcomes</span>
                </h3>
                <span className="text-xs text-[#52605C] font-semibold shrink-0 pl-2">{slots.length} scheduled</span>
              </div>

              {slots.length === 0 ? (
                <Card className="p-8 text-center text-xs text-[#52605C]">
                  No medication doses scheduled for today.
                </Card>
              ) : (
                <div className="space-y-3">
                  {slots.map((slot) => (
                    <div
                      key={slot.slotId}
                      className="p-5 rounded-[16px] bg-white border border-[#DCE9DF] shadow-xs flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#173F35] bg-[#EEF4EF] px-2 py-0.5 rounded">
                            {slot.scheduledTimeStr}
                          </span>
                          <h4 className="text-base font-bold text-[#173F35]">{slot.medication.name}</h4>
                        </div>
                        {slot.medication.dosage && (
                          <p className="text-xs text-[#6C9B8B] font-semibold">
                            {slot.medication.dosage}
                          </p>
                        )}
                        <p className="text-xs text-[#52605C]">{slot.medication.instructions}</p>
                      </div>

                      <StatusBadge status={slot.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prescriptions Summary */}
            <div className="lg:col-span-5 space-y-4">
              <div className="pb-2 border-b border-[#DCE9DF]">
                <h3 className="text-lg font-bold text-[#173F35] font-heading flex items-center gap-2">
                  <Pill className="w-5 h-5 text-[#173F35]" />
                  <span>Prescriptions Summary ({medications.length})</span>
                </h3>
              </div>

              <div className="space-y-3">
                {medications.map((med) => (
                  <Card key={med.medicationId} className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#173F35] text-sm">{med.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EEF4EF] text-[#173F35]">
                        {med.scheduledTimes.join(', ')}
                      </span>
                    </div>
                    {med.dosage && <p className="text-xs text-[#6C9B8B] font-semibold">{med.dosage}</p>}
                    <p className="text-xs text-[#52605C]">{med.instructions}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CARE TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-2 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              Care Timeline &amp; Activity Stream
            </h2>
            <p className="text-xs text-[#52605C]">
              Read-only log of dose records, caretaker confirmations, and appointments.
            </p>
          </div>

          <div className="bg-white rounded-[20px] border border-[#DCE9DF] overflow-hidden shadow-xs">
            {activities.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#52605C]">
                No care activities recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-[#DCE9DF]">
                {activities.map((act) => (
                  <div key={act.activityId} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-[#25312E]">{act.details}</p>
                      <p className="text-[11px] text-[#52605C] mt-0.5">
                        Recorded by {act.actorName} ({act.actorRole})
                      </p>
                    </div>
                    <span className="font-mono text-[#52605C] text-[11px]">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: UPCOMING APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-2 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              Upcoming Healthcare Appointments
            </h2>
            <p className="text-xs text-[#52605C]">
              Clinic consultations scheduled for your loved one.
            </p>
          </div>

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
                  className="p-6 rounded-[20px] bg-white border border-[#DCE9DF] shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#EEF4EF] text-[#173F35] text-xs font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{appt.date} at {appt.time}</span>
                    </span>
                    <span className="text-xs font-bold text-[#6C9B8B] uppercase">{appt.status}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#173F35]">{appt.title}</h3>
                    <p className="text-xs text-[#52605C]">{appt.doctorName} &middot; {appt.clinicOrHospital}</p>
                  </div>

                  {appt.location && (
                    <p className="text-xs text-[#52605C] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#52605C]" />
                      <span>{appt.location}</span>
                    </p>
                  )}

                  {appt.preparationInstructions && (
                    <div className="p-3 bg-[#F8F7F1] rounded-[8px] border border-[#DCE9DF] text-xs">
                      <span className="font-bold text-[#173F35] block">Prep Instructions:</span>
                      <p className="text-[#52605C]">{appt.preparationInstructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ALERTS & FOLLOW-UPS */}
      {activeTab === 'alerts' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-2 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              Care Alerts &amp; Handoff Follow-ups
            </h2>
            <p className="text-xs text-[#52605C]">
              Read-only view of unconfirmed dose follow-ups assigned to the primary caretaker.
            </p>
          </div>

          {careAlerts.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-sm text-[#52605C]">No care alerts or follow-ups on file.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {careAlerts.map((alert) => (
                <div
                  key={alert.alertId}
                  className={`p-5 rounded-[16px] border flex items-center justify-between gap-4 ${
                    alert.status === 'active'
                      ? 'bg-[#FDF2E9] border-[#FDBA74]'
                      : 'bg-white border-[#DCE9DF]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#173F35]">{alert.medicationName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          alert.status === 'active'
                            ? 'bg-[#9A3412] text-white'
                            : 'bg-[#EEF4EF] text-[#173F35]'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#52605C]">
                      Scheduled: {new Date(alert.scheduledAt).toLocaleString()}
                    </p>
                    {alert.outcome && (
                      <p className="text-xs font-semibold text-[#173F35]">
                        Outcome: [{alert.outcome}] {alert.outcomeNotes ? `— "${alert.outcomeNotes}"` : ''}
                      </p>
                    )}
                  </div>

                  <div className="text-right text-xs text-[#52605C]">
                    <span className="block font-medium">Assigned Caretaker</span>
                    <span>{alert.primaryCaretakerId ? 'Assigned' : 'Unassigned'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MEDICATION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-2 border-b border-[#DCE9DF]">
            <h2 className="text-2xl font-extrabold text-[#173F35] font-heading">
              Medication History (Read-Only)
            </h2>
            <p className="text-xs text-[#52605C]">
              Chronological log of verified dose outcomes.
            </p>
          </div>

          <div className="bg-white rounded-[20px] border border-[#DCE9DF] overflow-hidden shadow-xs">
            {doseEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#52605C]">
                No medication events recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-[#DCE9DF]">
                {doseEvents.map((ev) => (
                  <div key={ev.eventId} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#173F35]">{ev.medicationId}</span>
                        <StatusBadge status={ev.status} size="sm" />
                      </div>
                      <p className="text-[#52605C]">
                        Scheduled: {new Date(ev.scheduledAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right text-[#52605C]">
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
    </div>
  );
};
