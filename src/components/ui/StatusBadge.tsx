import React from 'react';
import { CheckCircle2, XCircle, HelpCircle, Clock, Info, AlertTriangle } from 'lucide-react';
import type { DoseStatus } from '../../types';

export interface StatusBadgeProps {
  status: DoseStatus | 'pending' | 'due' | 'upcoming' | 'info' | 'scheduled';
  size?: 'normal' | 'large' | 'small' | 'sm' | 'md';
  labelOverride?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'normal',
  labelOverride,
}) => {
  const config = {
    taken: {
      label: 'Taken',
      icon: CheckCircle2,
      containerClass: 'bg-[#DCE9DF] text-[#173F35] border border-[#173F35]/20',
      iconClass: 'text-[#173F35]',
    },
    skipped: {
      label: 'Skipped',
      icon: XCircle,
      containerClass: 'bg-[#F2ECEC] text-[#8F2D2D] border border-[#8F2D2D]/20',
      iconClass: 'text-[#8F2D2D]',
    },
    uncertain: {
      label: 'Not Sure',
      icon: HelpCircle,
      containerClass: 'bg-[#FDF7EB] text-[#875C0B] border border-[#E8B968]',
      iconClass: 'text-[#875C0B]',
    },
    overdue: {
      label: 'Overdue / Unconfirmed',
      icon: AlertTriangle,
      containerClass: 'bg-[#FDF2E9] text-[#9A3412] border border-[#FDBA74]',
      iconClass: 'text-[#9A3412]',
    },
    unconfirmed: {
      label: 'Unconfirmed',
      icon: AlertTriangle,
      containerClass: 'bg-[#FDF2E9] text-[#9A3412] border border-[#FDBA74]',
      iconClass: 'text-[#9A3412]',
    },
    scheduled: {
      label: 'Scheduled',
      icon: Clock,
      containerClass: 'bg-[#EEF4EF] text-[#52605C] border border-[#DCE9DF]',
      iconClass: 'text-[#52605C]',
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      containerClass: 'bg-[#EEF4EF] text-[#52605C] border border-[#DCE9DF]',
      iconClass: 'text-[#52605C]',
    },
    upcoming: {
      label: 'Upcoming',
      icon: Clock,
      containerClass: 'bg-[#FDF7EB] text-[#875C0B] border border-[#E8B968]/60',
      iconClass: 'text-[#875C0B]',
    },
    due: {
      label: 'Due Now',
      icon: Clock,
      containerClass: 'bg-[#173F35] text-white border border-[#173F35]',
      iconClass: 'text-white',
    },
    info: {
      label: 'Active',
      icon: Info,
      containerClass: 'bg-[#EBF3F0] text-[#173F35] border border-[#6C9B8B]/40',
      iconClass: 'text-[#6C9B8B]',
    },
  }[status];

  const IconComponent = config.icon;
  const isLarge = size === 'large';
  const displayLabel = labelOverride || config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-[8px] transition-colors select-none ${
        isLarge ? 'px-3.5 py-1.5 text-base' : 'px-2.5 py-1 text-xs'
      } ${config.containerClass}`}
      role="status"
    >
      <IconComponent className={isLarge ? 'w-5 h-5 shrink-0' : 'w-3.5 h-3.5 shrink-0'} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
};
