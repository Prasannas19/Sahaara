import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { useRouter } from '../../context/RouterContext';
import {
  LogOut,
  Menu,
  X,
  Users,
  Copy,
  Check,
  Type,
  ChevronDown,
  Shield,
  ExternalLink,
  Inbox,
} from 'lucide-react';
import type { Member, Circle } from '../../types';
import { AdminInquiriesModal } from '../admin/AdminInquiriesModal';

export interface NavShellProps {
  member: Member;
  circle: Circle | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export const NavShell: React.FC<NavShellProps> = ({
  member,
  circle,
  onLogout,
  children,
}) => {
  const { navigate } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [circleModalOpen, setCircleModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [inquiriesModalOpen, setInquiriesModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [textScale, setTextScale] = useState<number>(() => {
    const val = getComputedStyle(document.documentElement).getPropertyValue('--text-scale');
    return parseFloat(val) || 1;
  });

  const handleScaleChange = (scale: number) => {
    setTextScale(scale);
    document.documentElement.style.setProperty('--text-scale', String(scale));
  };

  const copyCircleId = () => {
    if (!circle?.circleId) return;
    navigator.clipboard.writeText(circle.circleId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const roleConfigs = {
    elder: {
      label: 'Elder Profile',
      badgeClass: 'bg-[#173F35] text-white',
    },
    caretaker: {
      label: 'Caretaker',
      badgeClass: 'bg-[#6C9B8B] text-white',
    },
    family: {
      label: 'Family Viewer',
      badgeClass: 'bg-[#DCE9DF] text-[#173F35]',
    },
  }[member.role];

  return (
    <div className="min-h-screen bg-[#F8F7F1] text-[#25312E] flex flex-col font-sans">
      {/* GLOBAL APPLICATION HEADER */}
      <header className="border-b border-[#DCE9DF] bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-[0_2px_8px_rgba(23,63,53,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Brand (clicking goes to dashboard home) + Role Badge */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#173F35] rounded-[8px]"
              aria-label="Sahaara Dashboard Home"
            >
              <BrandLogo variant="horizontal" size="md" showTagline={false} />
            </button>
            <div className="h-6 w-[1px] bg-[#DCE9DF] hidden sm:block" />
            <span
              className={`text-xs px-2.5 py-1 rounded-[8px] font-bold tracking-wide uppercase ${roleConfigs.badgeClass}`}
            >
              {roleConfigs.label}
            </span>
          </div>

          {/* Right Desktop Controls */}
          <div className="hidden md:flex items-center gap-4">
            {/* Compact Segmented Text-Size Control */}
            <div
              className="flex items-center gap-1 bg-[#EEF4EF] p-1 rounded-[8px] border border-[#DCE9DF]"
              role="group"
              aria-label="Display text size selection"
            >
              <Type className="w-4 h-4 text-[#52605C] ml-1.5 mr-0.5" aria-hidden="true" />
              <button
                type="button"
                onClick={() => handleScaleChange(1)}
                className={`min-h-[34px] px-2.5 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
                  textScale === 1
                    ? 'bg-[#173F35] text-white shadow-xs'
                    : 'text-[#25312E] hover:bg-white'
                }`}
                aria-pressed={textScale === 1}
                aria-label="Standard font size 100%"
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => handleScaleChange(1.15)}
                className={`min-h-[34px] px-2.5 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
                  textScale === 1.15
                    ? 'bg-[#173F35] text-white shadow-xs'
                    : 'text-[#25312E] hover:bg-white'
                }`}
                aria-pressed={textScale === 1.15}
                aria-label="Enlarged font size 115%"
              >
                115%
              </button>
              <button
                type="button"
                onClick={() => handleScaleChange(1.3)}
                className={`min-h-[34px] px-2.5 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
                  textScale === 1.3
                    ? 'bg-[#173F35] text-white shadow-xs'
                    : 'text-[#25312E] hover:bg-white'
                }`}
                aria-pressed={textScale === 1.3}
                aria-label="Extra large font size 130%"
              >
                130%
              </button>
            </div>

            {/* Care Circle Menu Trigger */}
            {circle && (
              <button
                type="button"
                onClick={() => setCircleModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-[8px] bg-[#EEF4EF] hover:bg-[#DCE9DF] text-[#173F35] text-xs font-bold border border-[#DCE9DF] transition-colors cursor-pointer"
                title="View Circle credentials and profile details"
              >
                <Users className="w-4 h-4 text-[#173F35]" />
                <span>Care Circle</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#52605C]" />
              </button>
            )}

            {/* User Profile Dropdown Button */}
            <div className="relative pl-3 border-l border-[#DCE9DF]">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-[8px] hover:bg-[#EEF4EF] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#173F35]"
                aria-expanded={userDropdownOpen}
                aria-label="User account menu"
              >
                <div className="w-9 h-9 rounded-full bg-[#173F35] text-white flex items-center justify-center font-bold text-sm">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-[#173F35] leading-tight">{member.name}</p>
                  <p className="text-[11px] text-[#52605C]">{member.email}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#52605C]" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-[16px] shadow-lg border border-[#DCE9DF] py-2 z-50 animate-in fade-in zoom-in-95"
                  role="menu"
                >
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="text-xs font-bold text-[#173F35]">{member.name}</p>
                    <p className="text-[11px] text-[#52605C] truncate">{member.email}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setCircleModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-[#25312E] hover:bg-[#EEF4EF] flex items-center gap-2 transition-colors"
                  >
                    <Users className="w-4 h-4 text-[#52605C]" />
                    <span>Care Circle Info</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      navigate('/');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-[#25312E] hover:bg-[#EEF4EF] flex items-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-[#52605C]" />
                    <span>Visit Sahaara Website</span>
                  </button>

                  {member.role === 'caretaker' && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setInquiriesModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[#25312E] hover:bg-[#EEF4EF] flex items-center gap-2 transition-colors"
                    >
                      <Inbox className="w-4 h-4 text-[#52605C]" />
                      <span>Support Inquiries</span>
                    </button>
                  )}

                  <div className="border-t border-neutral-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[#8F2D2D] hover:bg-[#F2ECEC] font-semibold flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-[#8F2D2D]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => handleScaleChange(textScale === 1 ? 1.25 : 1)}
              className="min-h-[44px] px-3 text-xs font-bold rounded-[8px] bg-[#EEF4EF] border border-[#DCE9DF] text-[#173F35]"
              aria-label="Toggle text size"
            >
              {textScale === 1 ? 'A (100%)' : 'A+ (125%)'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] border border-[#DCE9DF] text-[#173F35]"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#DCE9DF] bg-white px-6 py-6 space-y-4 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE9DF]">
              <div>
                <p className="font-bold text-[#173F35]">{member.name}</p>
                <p className="text-xs text-[#52605C]">{member.email}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-[8px] font-semibold ${roleConfigs.badgeClass}`}>
                {roleConfigs.label}
              </span>
            </div>

            {circle && (
              <div className="p-4 rounded-[12px] bg-[#EEF4EF] border border-[#DCE9DF] space-y-2">
                <span className="text-xs font-bold text-[#52605C] uppercase tracking-wider block">Care Circle</span>
                <p className="text-sm font-bold text-[#173F35]">{circle.elderName}</p>
                <button
                  onClick={copyCircleId}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-[#DCE9DF] rounded-[8px] text-xs font-bold text-[#173F35]"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-green-700" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Circle ID Copied' : 'Copy Circle ID'}</span>
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/');
              }}
              className="w-full py-2.5 px-3 rounded-[8px] text-left text-xs font-semibold text-[#173F35] bg-[#EEF4EF] flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Visit Sahaara Website</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-[8px] bg-[#F2ECEC] text-[#8F2D2D] font-bold text-base transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </header>

      {/* MAIN CONTENT REGION */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* CARE CIRCLE DETAILS MODAL */}
      {circleModalOpen && circle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#173F35]/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-[24px] shadow-2xl border border-[#DCE9DF] p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE9DF]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[8px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#173F35] font-heading">
                  Care Circle Information
                </h3>
              </div>
              <button
                onClick={() => setCircleModalOpen(false)}
                className="p-1.5 rounded-[6px] text-[#52605C] hover:text-[#173F35] hover:bg-[#EEF4EF] cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#52605C] leading-relaxed">
              Family members and caretakers need this Circle ID to connect their accounts with <strong>{circle.elderName}</strong>.
            </p>

            <div className="p-4 rounded-[12px] bg-[#EEF4EF] border border-[#DCE9DF] space-y-2">
              <span className="text-xs font-bold text-[#52605C] uppercase tracking-wider">Circle ID</span>
              <p className="font-mono text-sm font-bold text-[#173F35] break-all select-all">{circle.circleId}</p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={copyCircleId}
                className="flex-1 min-h-[48px] px-4 rounded-[8px] bg-[#173F35] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#13352D] transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied to Clipboard' : 'Copy Circle ID'}</span>
              </button>
              <button
                onClick={() => setCircleModalOpen(false)}
                className="min-h-[48px] px-4 rounded-[8px] border border-[#DCE9DF] text-[#52605C] font-semibold text-sm hover:bg-[#EEF4EF] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN INQUIRIES MODAL (PHASE 2) */}
      <AdminInquiriesModal
        isOpen={inquiriesModalOpen}
        onClose={() => setInquiriesModalOpen(false)}
      />

      {/* FOOTER */}
      <footer className="border-t border-[#DCE9DF] bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#52605C] gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#173F35]">Sahaara</span>
            <span>&middot;</span>
            <span>Care that connects. Support that matters.</span>
          </div>
          <div>
            Elder-centric design &middot; WCAG compliant touch targets &middot; Authoritative Role Permissions
          </div>
        </div>
      </footer>
    </div>
  );
};
