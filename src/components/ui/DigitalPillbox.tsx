import React from 'react';
import { Sun, Sunset, Moon, Sunrise, CheckCircle2, Pill } from 'lucide-react';
import type { DoseSlot } from '../../types';
import { StatusBadge } from './StatusBadge';

export interface DigitalPillboxProps {
  slots: DoseSlot[];
  onTakeDose?: (slot: DoseSlot) => void;
  readOnly?: boolean;
}

export const DigitalPillbox: React.FC<DigitalPillboxProps> = ({ slots, onTakeDose, readOnly = false }) => {
  // Partition slots into Morning (05:00 - 11:59), Afternoon (12:00 - 16:59), Evening (17:00 - 20:59), Night (21:00 - 04:59)
  const compartments = [
    {
      id: 'morning',
      label: 'Morning',
      timeRange: '05:00 AM – 11:59 AM',
      icon: Sunrise,
      iconColor: 'text-[#E8B968]',
      bgHeader: 'bg-[#FDF7EB]',
      borderHeader: 'border-[#F4DFB6]',
      slots: slots.filter((s) => {
        const hour = parseInt(s.scheduledTimeStr.split(':')[0], 10);
        return hour >= 5 && hour < 12;
      }),
    },
    {
      id: 'afternoon',
      label: 'Afternoon',
      timeRange: '12:00 PM – 04:59 PM',
      icon: Sun,
      iconColor: 'text-[#E89234]',
      bgHeader: 'bg-[#FFF6ED]',
      borderHeader: 'border-[#FFDEC2]',
      slots: slots.filter((s) => {
        const hour = parseInt(s.scheduledTimeStr.split(':')[0], 10);
        return hour >= 12 && hour < 17;
      }),
    },
    {
      id: 'evening',
      label: 'Evening',
      timeRange: '05:00 PM – 08:59 PM',
      icon: Sunset,
      iconColor: 'text-[#6C9B8B]',
      bgHeader: 'bg-[#EEF4EF]',
      borderHeader: 'border-[#DCE9DF]',
      slots: slots.filter((s) => {
        const hour = parseInt(s.scheduledTimeStr.split(':')[0], 10);
        return hour >= 17 && hour < 21;
      }),
    },
    {
      id: 'night',
      label: 'Bedtime / Night',
      timeRange: '09:00 PM – 04:59 AM',
      icon: Moon,
      iconColor: 'text-[#173F35]',
      bgHeader: 'bg-[#E7EEE9]',
      borderHeader: 'border-[#CADBD0]',
      slots: slots.filter((s) => {
        const hour = parseInt(s.scheduledTimeStr.split(':')[0], 10);
        return hour >= 21 || hour < 5;
      }),
    },
  ];

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#DCE9DF]">
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-[#173F35]" />
          <h3 className="text-lg font-bold font-heading text-[#173F35]">
            Digital Pillbox Organiser
          </h3>
        </div>
        <span className="text-xs text-[#52605C] font-medium">
          4-period visual dispenser &middot; Derived from active prescriptions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {compartments.map((comp) => {
          const Icon = comp.icon;
          const allTaken = comp.slots.length > 0 && comp.slots.every((s) => s.status === 'taken');
          const hasOverdue = comp.slots.some((s) => s.status === 'overdue' || s.status === 'uncertain');

          return (
            <div
              key={comp.id}
              className={`rounded-[18px] bg-white border-2 transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                hasOverdue
                  ? 'border-[#E8B968] ring-2 ring-[#E8B968]/20'
                  : allTaken
                  ? 'border-[#6C9B8B] bg-[#F9FCFA]'
                  : 'border-[#DCE9DF]'
              }`}
            >
              {/* Compartment Header */}
              <div className={`p-3.5 border-b flex items-center justify-between ${comp.bgHeader} ${comp.borderHeader}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 shrink-0 ${comp.iconColor}`} />
                  <div>
                    <h4 className="text-sm font-extrabold text-[#173F35] font-heading leading-tight">
                      {comp.label}
                    </h4>
                    <p className="text-[10px] text-[#52605C] font-semibold">{comp.timeRange}</p>
                  </div>
                </div>

                {allTaken ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[#DCE9DF] text-[#173F35] text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Done</span>
                  </span>
                ) : comp.slots.length === 0 ? (
                  <span className="text-[10px] text-[#52605C] font-medium">Empty</span>
                ) : (
                  <span className="text-[11px] font-bold text-[#173F35] bg-white px-2 py-0.5 rounded-[6px] border border-[#DCE9DF]">
                    {comp.slots.length} pill{comp.slots.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              {/* Compartment Body */}
              <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-start">
                {comp.slots.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#52605C] italic">
                    No medications due in this period
                  </div>
                ) : (
                  comp.slots.map((slot) => {
                    const isTaken = slot.status === 'taken';
                    const isOverdue = slot.status === 'overdue';
                    const isUncertain = slot.status === 'uncertain';

                    return (
                      <div
                        key={slot.slotId}
                        className={`p-3 rounded-[12px] border transition-all text-left space-y-2 ${
                          isTaken
                            ? 'bg-[#EEF4EF]/70 border-[#DCE9DF] opacity-80'
                            : isOverdue
                            ? 'bg-[#FDF2E9] border-[#FDBA74]'
                            : isUncertain
                            ? 'bg-[#FDF7EB] border-[#E8B968]'
                            : 'bg-[#F8F7F1] border-[#DCE9DF]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <div className="font-bold text-xs text-[#173F35] flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-white border border-[#DCE9DF] text-[10px]">
                                {slot.scheduledTimeStr}
                              </span>
                              <span className="truncate max-w-[130px]">{slot.medication.name}</span>
                            </div>
                            <p className="text-[11px] text-[#52605C] mt-0.5">
                              {slot.medication.dosage || 'Prescribed dose'}
                            </p>
                          </div>
                          <StatusBadge status={slot.status} size="sm" />
                        </div>

                        {slot.medication.instructions && (
                          <p className="text-[10px] text-[#52605C] leading-snug line-clamp-2 italic bg-white/60 p-1.5 rounded-[6px]">
                            {slot.medication.instructions}
                          </p>
                        )}

                        {!readOnly && onTakeDose && slot.status !== 'taken' && (
                          <button
                            type="button"
                            onClick={() => onTakeDose(slot)}
                            className="w-full py-1.5 rounded-[6px] bg-[#173F35] hover:bg-[#1f5246] text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Taken</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
