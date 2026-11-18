import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../ui/BrandLogo';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Menu,
  X,
  Type,
  Sun,
  Smartphone,
  Lock,
  KeyRound,
  LayoutDashboard,
  ShieldAlert,
  CalendarCheck,
  Pill,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { navigate } = useRouter();
  const { currentUser, member } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState<'elder' | 'caretaker' | 'family'>('elder');
  const [previewDoseStatus, setPreviewDoseStatus] = useState<'pending' | 'taken' | 'skipped' | 'uncertain'>('pending');

  // Interactive Philosophy card modal/detail state
  const [activePhilosophyModal, setActivePhilosophyModal] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const philosophyDetails = [
    {
      id: 1,
      title: 'Independence',
      subtitle: 'Elder-Centric Design Philosophy',
      icon: Sun,
      color: '#E8B968',
      desc: 'Elderly individuals remain at the centre of their daily care. Large text, high contrast, and distraction-free reminders empower self-reliance without confusion or anxiety.',
      bullets: [
        'Large, accessible action buttons (minimum 56px touch target height)',
        'Next medication due displayed front and centre with clear instructions',
        'Built-in text size adjustment scaling up to 130% for visual comfort',
      ],
    },
    {
      id: 2,
      title: 'Connection',
      subtitle: 'Shared Private Care Circles',
      icon: Users,
      color: '#6C9B8B',
      desc: 'Care is not a solo effort. Authorised family members and primary caretakers coordinate collaboratively through a private, invite-secured Circle.',
      bullets: [
        'Elder invites family members and caretakers with single-use invite codes',
        'Caretakers manage prescriptions, daily times, and medication instructions',
        'Family members view live dose statuses from anywhere in the world',
      ],
    },
    {
      id: 3,
      title: 'Reliability',
      subtitle: 'Deterministic Accuracy & Zero Duplicates',
      icon: ShieldCheck,
      color: '#DCE9DF',
      desc: 'Every medication action is recorded deterministically to guarantee complete auditability, duplicate prevention, and peace of mind for the entire family.',
      bullets: [
        'Deterministic event IDs guarantee zero duplicate logs on double-taps',
        'Authoritative Firestore security rules enforce role-specific permissions',
        'Automatic chronological daily schedule generation from active prescriptions',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F1] text-[#25312E] flex flex-col font-sans selection:bg-[#DCE9DF] selection:text-[#173F35]">
      {/* 4. REFINED TRANSLUCENT GLASS NAVBAR */}
      <nav
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/85 backdrop-blur-md shadow-[0_4px_20px_rgba(23,63,53,0.06)] py-3.5 border-b border-[#DCE9DF]/80'
            : 'bg-[#F8F7F1]/80 backdrop-blur-sm py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#173F35] rounded-[8px]"
            aria-label="Sahaara Home"
          >
            <BrandLogo variant="horizontal" size="md" showTagline={false} />
          </button>

          {/* Primary Navigation: About, How It Works, Features, Accessibility */}
          <div className="hidden lg:flex items-center gap-8">
            <a
              href="#about"
              className="text-sm font-bold text-[#52605C] hover:text-[#173F35] transition-colors"
            >
              About
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-bold text-[#52605C] hover:text-[#173F35] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="text-sm font-bold text-[#52605C] hover:text-[#173F35] transition-colors"
            >
              Features
            </a>
            <a
              href="#accessibility"
              className="text-sm font-bold text-[#52605C] hover:text-[#173F35] transition-colors"
            >
              Accessibility
            </a>
          </div>

          {/* Authentication-Aware Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {currentUser && member ? (
              /* Signed-in user view */
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={() => navigate('/dashboard')}
                  className="text-sm px-5 font-bold flex items-center gap-2 shadow-xs"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </Button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-10 h-10 rounded-full bg-[#173F35] text-white flex items-center justify-center font-bold text-sm shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#173F35]"
                  title={`Signed in as ${member.name} (${member.role})`}
                >
                  {member.name.charAt(0).toUpperCase()}
                </button>
              </div>
            ) : (
              /* Signed-out visitor view */
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="min-h-[44px] px-5 text-sm font-bold text-[#173F35] hover:bg-[#EEF4EF] rounded-[8px] transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <Button
                  variant="primary"
                  onClick={() => navigate('/signup')}
                  className="text-sm px-5 font-bold shadow-xs"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden p-2 rounded-[8px] text-[#173F35] hover:bg-[#EEF4EF] focus:outline-none focus:ring-2 focus:ring-[#173F35]"
            aria-label="Toggle navigation menu"
          >
            {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-[#DCE9DF] px-6 py-6 space-y-4 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex flex-col space-y-3 text-left">
              <a
                href="#about"
                onClick={() => setMobileNavOpen(false)}
                className="text-base font-bold text-[#25312E] py-2 border-b border-neutral-100"
              >
                About
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileNavOpen(false)}
                className="text-base font-bold text-[#25312E] py-2 border-b border-neutral-100"
              >
                How It Works
              </a>
              <a
                href="#features"
                onClick={() => setMobileNavOpen(false)}
                className="text-base font-bold text-[#25312E] py-2 border-b border-neutral-100"
              >
                Features
              </a>
              <a
                href="#accessibility"
                onClick={() => setMobileNavOpen(false)}
                className="text-base font-bold text-[#25312E] py-2"
              >
                Accessibility
              </a>
            </div>

            <div className="pt-4 flex flex-col gap-3 border-t border-[#DCE9DF]">
              {currentUser && member ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    setMobileNavOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full text-base font-bold flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Go to Dashboard</span>
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setMobileNavOpen(false);
                      navigate('/login');
                    }}
                    className="w-full text-base font-bold"
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setMobileNavOpen(false);
                      navigate('/signup');
                    }}
                    className="w-full text-base font-bold"
                  >
                    Get Started with Sahaara
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* A. HERO SECTION */}
      <section className="pt-8 pb-16 lg:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] bg-[#EEF4EF] border border-[#DCE9DF] text-[#173F35] text-xs font-bold tracking-wide uppercase">
                <ShieldCheck className="w-4 h-4 text-[#173F35]" />
                <span>Elder Care &amp; Medication Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#173F35] font-heading tracking-tight leading-[1.1]">
                Better care begins with being connected.
              </h1>

              <p className="text-lg sm:text-xl text-[#52605C] font-normal leading-relaxed max-w-xl">
                Sahaara helps older adults manage everyday medication routines while keeping authorised caretakers and family members informed and connected.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => navigate(currentUser && member ? '/dashboard' : '/signup')}
                  className="group flex items-center justify-center gap-2 text-base font-bold shadow-[0_4px_16px_rgba(23,63,53,0.2)]"
                >
                  <span>{currentUser && member ? 'Go to Dashboard' : 'Get Started'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <a
                  href="#how-it-works"
                  className="min-h-[56px] px-6 py-3 rounded-[8px] bg-white border border-[#173F35]/20 text-[#173F35] font-semibold text-base flex items-center justify-center hover:bg-[#EEF4EF] transition-colors"
                >
                  Explore How It Works
                </a>
              </div>

              <div className="pt-4 flex items-center gap-6 text-xs text-[#52605C] font-medium border-t border-[#DCE9DF]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#173F35]" />
                  Zero-clutter interface
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#173F35]" />
                  Private Care Circle
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#173F35]" />
                  Large touch targets
                </span>
              </div>
            </div>

            {/* Right Product Preview (Clearly labeled interactive demonstration) */}
            <div className="lg:col-span-6 relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#DCE9DF]/50 to-[#6C9B8B]/20 rounded-[32px] blur-xl -z-10" />

              <div className="bg-white rounded-[24px] shadow-[0_16px_40px_rgba(23,63,53,0.12)] border-2 border-[#DCE9DF] p-6 sm:p-8 space-y-6 text-left">
                {/* Mock Header with Demo Label */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#DCE9DF]">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-xs uppercase font-extrabold text-[#52605C] tracking-wider">
                        Today's Schedule &middot; Morning
                      </span>
                      <span className="text-[10px] bg-[#EEF4EF] text-[#173F35] font-bold px-1.5 py-0.5 rounded">
                        Interactive Demonstration
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-[#173F35] font-heading mt-1.5">
                      Good morning, Rose
                    </h3>
                  </div>
                  <div className="self-start shrink-0 px-3 py-1.5 bg-[#EEF4EF] border border-[#DCE9DF] rounded-[8px] text-xs font-bold text-[#173F35]">
                    {previewDoseStatus === 'taken'
                      ? '1 of 1 Complete (100%)'
                      : previewDoseStatus === 'skipped'
                      ? '0 of 1 Complete (1 Skipped)'
                      : previewDoseStatus === 'uncertain'
                      ? '0 of 1 Complete (Needs Check)'
                      : '0 of 1 Complete (0%)'}
                  </div>
                </div>

                {/* Next Medication Due Card */}
                <div className="bg-[#F8F7F1] rounded-[16px] p-5 sm:p-6 border-2 border-[#173F35] shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#173F35] text-white text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>08:00 AM &middot; Morning Dose</span>
                    </span>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-[6px] flex items-center gap-1 ${
                        previewDoseStatus === 'taken'
                          ? 'bg-[#DCE9DF] text-[#173F35] border border-[#173F35]/30'
                          : previewDoseStatus === 'skipped'
                          ? 'bg-[#F2ECEC] text-[#8F2D2D]'
                          : previewDoseStatus === 'uncertain'
                          ? 'bg-[#FDF7EB] text-[#875C0B] border border-[#E8B968]'
                          : 'bg-[#EEF4EF] text-[#52605C]'
                      }`}
                    >
                      {previewDoseStatus === 'taken' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {previewDoseStatus === 'skipped' && <XCircle className="w-3.5 h-3.5" />}
                      {previewDoseStatus === 'uncertain' && <HelpCircle className="w-3.5 h-3.5" />}
                      {previewDoseStatus === 'pending' && <Clock className="w-3.5 h-3.5" />}
                      <span className="capitalize">{previewDoseStatus === 'uncertain' ? 'Not Sure' : previewDoseStatus}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-2xl font-extrabold text-[#173F35] font-heading">
                      Metformin 500mg
                    </h4>
                    <p className="text-sm font-medium text-[#25312E] mt-1 bg-white p-3 rounded-[8px] border border-[#DCE9DF]">
                      Take 1 tablet with a full glass of water after breakfast.
                    </p>
                  </div>

                  {/* Actions inside demo preview */}
                  <div className="pt-2">
                    <p className="text-xs font-bold text-[#52605C] mb-2">
                      Did you take this medication? (Interactive Demo)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoseStatus('taken')}
                        className={`min-h-[48px] px-2 py-2 rounded-[8px] font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          previewDoseStatus === 'taken'
                            ? 'bg-[#173F35] text-white shadow-xs'
                            : 'bg-white hover:bg-[#EEF4EF] text-[#173F35] border border-[#173F35]/30'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Taken</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewDoseStatus('skipped')}
                        className={`min-h-[48px] px-2 py-2 rounded-[8px] font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          previewDoseStatus === 'skipped'
                            ? 'bg-[#8F2D2D] text-white shadow-xs'
                            : 'bg-white hover:bg-[#F2ECEC] text-[#8F2D2D] border border-[#8F2D2D]/30'
                        }`}
                      >
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>Skipped</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewDoseStatus('uncertain')}
                        className={`min-h-[48px] px-2 py-2 rounded-[8px] font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          previewDoseStatus === 'uncertain'
                            ? 'bg-[#E8B968] text-[#25312E] shadow-xs'
                            : 'bg-white hover:bg-[#FDF7EB] text-[#875C0B] border border-[#E8B968]'
                        }`}
                      >
                        <HelpCircle className="w-4 h-4 shrink-0" />
                        <span>Not Sure</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upcoming Evening Preview */}
                <div className="p-3.5 rounded-[12px] bg-white border border-[#DCE9DF] flex items-center justify-between text-xs text-[#52605C]">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#173F35] px-2 py-1 bg-[#EEF4EF] rounded-[4px]">08:00 PM</span>
                    <span>Blood Pressure &middot; Amlodipine 5mg</span>
                  </div>
                  <span className="font-medium text-[#6C9B8B]">Scheduled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* B. CORE PHILOSOPHY (Universal Card Interaction with Detail Expansion) */}
      <section id="about" className="py-20 bg-white border-y border-[#DCE9DF] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6C9B8B]">
              Core Philosophy
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#173F35] font-heading">
              Care should feel simple. Even when life gets complicated.
            </h2>
            <p className="text-base sm:text-lg text-[#52605C] leading-relaxed">
              Healthcare technology shouldn't feel like a clinical administration terminal. We built Sahaara around three foundational values:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {philosophyDetails.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <Card
                  key={item.id}
                  interactive
                  clickable
                  onClick={() => setActivePhilosophyModal(idx)}
                  className="flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-[16px] bg-[#173F35] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      <IconComp className="w-7 h-7" style={{ color: item.color }} />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#6C9B8B]">
                        {item.subtitle}
                      </span>
                      <h3 className="text-2xl font-bold text-[#173F35] font-heading mt-1">
                        {item.id}. {item.title}
                      </h3>
                    </div>
                    <p className="text-sm text-[#52605C] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#DCE9DF] flex items-center justify-between text-xs font-bold text-[#173F35]">
                    <span>Learn more details</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Philosophy Detail Modal */}
      {activePhilosophyModal !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#173F35]/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-[24px] shadow-2xl border border-[#DCE9DF] p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE9DF]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#173F35] text-white flex items-center justify-center">
                  {React.createElement(philosophyDetails[activePhilosophyModal].icon, {
                    className: 'w-5 h-5',
                    style: { color: philosophyDetails[activePhilosophyModal].color },
                  })}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#173F35] font-heading">
                    {philosophyDetails[activePhilosophyModal].title}
                  </h3>
                  <p className="text-xs text-[#52605C]">
                    {philosophyDetails[activePhilosophyModal].subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePhilosophyModal(null)}
                className="p-2 rounded-[8px] text-[#52605C] hover:text-[#173F35] hover:bg-[#EEF4EF] cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#52605C] leading-relaxed">
              {philosophyDetails[activePhilosophyModal].desc}
            </p>

            <div className="space-y-2.5 bg-[#EEF4EF] p-4 rounded-[16px] border border-[#DCE9DF]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#173F35]">
                Key Architectural Pillars
              </span>
              <ul className="space-y-2 text-xs text-[#25312E] font-medium">
                {philosophyDetails[activePhilosophyModal].bullets.map((b, bIdx) => (
                  <li key={bIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#173F35] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant="primary"
              onClick={() => setActivePhilosophyModal(null)}
              className="w-full font-bold"
            >
              Close Details
            </Button>
          </div>
        </div>
      )}

      {/* C. HOW SAHAARA WORKS (Universal Card Interactions) */}
      <section id="how-it-works" className="py-20 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6C9B8B]">
              Seamless Coordination
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#173F35] font-heading">
              How Sahaara Works
            </h2>
            <p className="text-base sm:text-lg text-[#52605C]">
              Simple, reliable medication routine coordination in three straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Card interactive className="space-y-5 text-left">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-[10px] bg-[#173F35] text-white font-bold flex items-center justify-center text-base shadow-xs group-hover:scale-105 transition-transform">
                  1
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#EEF4EF] text-[#173F35] rounded-[6px]">
                  Setup
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#173F35] font-heading">
                Elder creates a private care circle
              </h3>
              <p className="text-sm text-[#52605C] leading-relaxed">
                The elder creates their profile and gets a Circle ID, then generates a single-use invite code for each designated family member and primary caretaker.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-medium text-[#173F35]">
                <ShieldCheck className="w-4 h-4 text-[#6C9B8B]" />
                <span>Invite-verified member access</span>
              </div>
            </Card>

            {/* Step 2 */}
            <Card interactive className="space-y-5 text-left">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-[10px] bg-[#173F35] text-white font-bold flex items-center justify-center text-base shadow-xs group-hover:scale-105 transition-transform">
                  2
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#EEF4EF] text-[#173F35] rounded-[6px]">
                  Daily Routine
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#173F35] font-heading">
                Authorised caretaker configures medication
              </h3>
              <p className="text-sm text-[#52605C] leading-relaxed">
                Caretakers input prescription names, scheduled times, instructions, and photo reference URLs. Doses appear automatically on the elder's daily screen.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-medium text-[#173F35]">
                <Clock className="w-4 h-4 text-[#6C9B8B]" />
                <span>Automatic daily slot generation</span>
              </div>
            </Card>

            {/* Step 3 */}
            <Card interactive className="space-y-5 text-left">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-[10px] bg-[#173F35] text-white font-bold flex items-center justify-center text-base shadow-xs group-hover:scale-105 transition-transform">
                  3
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#EEF4EF] text-[#173F35] rounded-[6px]">
                  Peace of Mind
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#173F35] font-heading">
                Elder records outcomes, circle stays informed
              </h3>
              <p className="text-sm text-[#52605C] leading-relaxed">
                Elder logs Taken, Skipped, or Not sure with a single tap. Authorised family members and caretakers view live status updates from wherever they are.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-medium text-[#173F35]">
                <CheckCircle2 className="w-4 h-4 text-[#6C9B8B]" />
                <span>Live status transparency</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* D. COMPREHENSIVE FEATURES (Universal Card Interactions) */}
      <section id="features" className="py-20 bg-white border-y border-[#DCE9DF] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6C9B8B]">
              Comprehensive Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#173F35] font-heading">
              Everything needed for safe, coordinated care
            </h2>
            <p className="text-base sm:text-lg text-[#52605C]">
              Engineered with care for elderly independence and family peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <Card interactive className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 text-[#173F35]" />
              </div>
              <h3 className="text-base font-bold text-[#173F35]">Medication Scheduling</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                Configure fixed daily scheduled times (morning, afternoon, evening) with automatic daily timeline generation.
              </p>
            </Card>

            <Card interactive className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center font-bold">
                <Pill className="w-5 h-5 text-[#173F35]" />
              </div>
              <h3 className="text-base font-bold text-[#173F35]">Clear Prescribed Instructions</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                Prominent medical directions (e.g. &ldquo;take with food after breakfast&rdquo;) with optional pill photo recognition links.
              </p>
            </Card>

            <Card interactive className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 text-[#173F35]" />
              </div>
              <h3 className="text-base font-bold text-[#173F35]">Dose Status Actions</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                Simple one-tap logging for Taken, Skipped, and Not sure, designed with 56px touch targets for elderly hands.
              </p>
            </Card>

            <Card interactive className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-[#173F35]" />
              </div>
              <h3 className="text-base font-bold text-[#173F35]">Private Care Circles</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                Secure invitation system connecting elders with designated caretakers and family viewers under one private circle ID.
              </p>
            </Card>

            <Card interactive className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center font-bold">
                <Lock className="w-5 h-5 text-[#173F35]" />
              </div>
              <h3 className="text-base font-bold text-[#173F35]">Role-Based Access</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                Authoritative Firestore security rules enforce write protection for caretakers/elders and strict read-only access for family.
              </p>
            </Card>

            <Card interactive className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 text-[#173F35]" />
              </div>
              <h3 className="text-base font-bold text-[#173F35]">Zero Duplicate Prevention</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                Deterministic event IDs merge double-taps and retries, eliminating duplicated doses and maintaining accurate records.
              </p>
            </Card>

            <Card interactive className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center font-bold">
                <CalendarCheck className="w-5 h-5 text-[#173F35]" />
              </div>
              <h3 className="text-base font-bold text-[#173F35]">Care Activity History</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                Audit logs showing exact timestamps and resolved statuses for every recorded medication slot throughout the day.
              </p>
            </Card>

            <Card interactive className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5 text-[#173F35]" />
              </div>
              <h3 className="text-base font-bold text-[#173F35]">Care Handoff Protocol</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                Unconfirmed medication doses create accountable caretaker follow-ups, with acknowledgement, verified outcomes and a chronological care activity record.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* E. ROLE-SPECIFIC SHOWCASE (Universal Card Interactions) */}
      <section className="py-20 bg-[#F8F7F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6C9B8B]">
              Role-Specific Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#173F35] font-heading">
              Designed for every member of the care circle
            </h2>
            <p className="text-base sm:text-lg text-[#52605C]">
              One platform, three tailored experiences powered by backend security rules.
            </p>

            {/* Role Switcher Tabs */}
            <div className="inline-flex p-1 bg-[#EEF4EF] rounded-[12px] border border-[#DCE9DF] mt-4">
              <button
                type="button"
                onClick={() => setActiveFeatureTab('elder')}
                className={`px-5 py-2.5 rounded-[8px] text-sm font-bold transition-all cursor-pointer ${
                  activeFeatureTab === 'elder'
                    ? 'bg-[#173F35] text-white shadow-xs'
                    : 'text-[#52605C] hover:text-[#173F35]'
                }`}
              >
                Elder Interface
              </button>
              <button
                type="button"
                onClick={() => setActiveFeatureTab('caretaker')}
                className={`px-5 py-2.5 rounded-[8px] text-sm font-bold transition-all cursor-pointer ${
                  activeFeatureTab === 'caretaker'
                    ? 'bg-[#173F35] text-white shadow-xs'
                    : 'text-[#52605C] hover:text-[#173F35]'
                }`}
              >
                Caretaker Console
              </button>
              <button
                type="button"
                onClick={() => setActiveFeatureTab('family')}
                className={`px-5 py-2.5 rounded-[8px] text-sm font-bold transition-all cursor-pointer ${
                  activeFeatureTab === 'family'
                    ? 'bg-[#173F35] text-white shadow-xs'
                    : 'text-[#52605C] hover:text-[#173F35]'
                }`}
              >
                Family Viewer (Read-Only)
              </button>
            </div>
          </div>

          {/* Dynamic Tab Content inside Universal Interactive Card */}
          <Card interactive className="p-8 lg:p-12 border border-[#DCE9DF]">
            {activeFeatureTab === 'elder' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-left">
                <div className="space-y-5">
                  <div>
                    <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#173F35] bg-[#DCE9DF] px-3.5 py-1 rounded-[6px] mb-3.5">
                      Elder-First Experience
                    </span>
                    <h3 className="text-3xl font-extrabold text-[#173F35] font-heading leading-tight">
                      Clear, calm, and distraction-free
                    </h3>
                  </div>
                  <p className="text-base text-[#52605C] leading-relaxed">
                    Designed specifically for older adults. Type is enlarged by default, touch targets exceed 56px, and information hierarchy emphasizes only what is due right now.
                  </p>
                  <ul className="space-y-2 text-sm text-[#25312E] font-medium pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#173F35]" />
                      Hero card showing the immediate next medication
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#173F35]" />
                      Taken, Skipped, and Not Sure actions with instant audio &amp; visual feedback
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#173F35]" />
                      Global text-scaling adjustment (100%, 115%, 130%)
                    </li>
                  </ul>
                </div>
                <div className="bg-[#F8F7F1] p-6 rounded-[16px] border border-[#DCE9DF] shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#173F35] uppercase">Next Dose (Demo)</span>
                    <span className="text-xs bg-[#DCE9DF] text-[#173F35] px-2 py-0.5 rounded font-semibold">Morning</span>
                  </div>
                  <h4 className="text-2xl font-bold text-[#173F35]">Metformin 500mg</h4>
                  <p className="text-sm text-[#52605C] bg-white p-3 rounded-[8px] border border-[#DCE9DF]">
                    Instructions: Take 1 tablet after meals with water.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="p-3 text-center rounded-[8px] bg-[#173F35] text-white font-bold text-sm">Taken</div>
                    <div className="p-3 text-center rounded-[8px] bg-[#F2ECEC] text-[#8F2D2D] font-bold text-sm">Skipped</div>
                    <div className="p-3 text-center rounded-[8px] bg-[#FDF7EB] text-[#875C0B] font-bold text-sm">Not Sure</div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'caretaker' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-left">
                <div className="space-y-5">
                  <div>
                    <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#173F35] bg-[#DCE9DF] px-3.5 py-1 rounded-[6px] mb-3.5">
                      Caretaker Management Console
                    </span>
                    <h3 className="text-3xl font-extrabold text-[#173F35] font-heading leading-tight">
                      Complete prescription coordination
                    </h3>
                  </div>
                  <p className="text-base text-[#52605C] leading-relaxed">
                    A structured overview with full CRUD capabilities for medications, schedules, photo reference links, and live dose monitoring with caretaker override.
                  </p>
                  <ul className="space-y-2 text-sm text-[#25312E] font-medium pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#173F35]" />
                      Full medication management: add, edit, deactivate, or delete
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#173F35]" />
                      Elder View Preview modal to verify the patient's exact screen
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#173F35]" />
                      Deterministic dose records preventing duplicated logs
                    </li>
                  </ul>
                </div>
                <div className="bg-[#F8F7F1] p-6 rounded-[16px] border border-[#DCE9DF] shadow-md space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#DCE9DF]">
                    <span className="text-sm font-bold text-[#173F35]">Medication Directory (Demo)</span>
                    <span className="text-xs font-semibold text-[#6C9B8B]">+ Add Medication</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-[8px] bg-white border border-[#DCE9DF] flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-[#173F35] text-sm block">Metformin 500mg</span>
                        <span className="text-[#52605C]">Times: 08:00, 20:00</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#DCE9DF] text-[#173F35] font-bold">Active</span>
                    </div>
                    <div className="p-3 rounded-[8px] bg-white border border-[#DCE9DF] flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-[#173F35] text-sm block">Amlodipine 5mg</span>
                        <span className="text-[#52605C]">Times: 08:00 PM</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#DCE9DF] text-[#173F35] font-bold">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'family' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-left">
                <div className="space-y-5">
                  <div>
                    <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#173F35] bg-[#DCE9DF] px-3.5 py-1 rounded-[6px] mb-3.5">
                      Family Viewer Transparency (Strictly Read-Only)
                    </span>
                    <h3 className="text-3xl font-extrabold text-[#173F35] font-heading leading-tight">
                      Reassurance at a glance
                    </h3>
                  </div>
                  <p className="text-base text-[#52605C] leading-relaxed">
                    Family members stay in the loop without clutter. They see today's completion rates, schedule statuses, and dose records with strict read-only permissions.
                  </p>
                  <ul className="space-y-2 text-sm text-[#25312E] font-medium pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#173F35]" />
                      Real-time dose status updates (Taken, Skipped, Not Sure)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#173F35]" />
                      Read-only security enforced directly in Firestore rules
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#173F35]" />
                      Calm, reassuring summary of daily elder progress
                    </li>
                  </ul>
                </div>
                <div className="bg-[#F8F7F1] p-6 rounded-[16px] border border-[#DCE9DF] shadow-md space-y-4">
                  <div className="p-4 rounded-[12px] bg-[#EEF4EF] text-center border border-[#DCE9DF]">
                    <span className="text-xs uppercase font-bold text-[#52605C]">Today's Status (Demo)</span>
                    <p className="text-2xl font-bold text-[#173F35] mt-1">2 of 2 Completed</p>
                    <span className="text-xs text-[#52605C]">All medications recorded on time</span>
                  </div>
                  <div className="text-xs space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-white border border-neutral-200">
                      <span>Morning &middot; Metformin 500mg</span>
                      <span className="font-bold text-[#173F35] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Taken 8:05 AM
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* F. ACCESSIBILITY SECTION (Universal Card Interactions) */}
      <section id="accessibility" className="py-20 bg-white border-t border-[#DCE9DF] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6C9B8B]">
              Accessibility by Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#173F35] font-heading">
              Designed for people, not just screens.
            </h2>
            <p className="text-base sm:text-lg text-[#52605C]">
              Elder-centric usability engineered for varying degrees of vision, dexterity, and cognitive load.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <Card interactive className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center font-bold">
                <Type className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#173F35]">Adjustable Text Scaling</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                Single CSS custom property scales typography globally up to 130% without breaking fluid layouts.
              </p>
            </Card>

            <Card interactive className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center font-bold">
                <Sun className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#173F35]">High Contrast Tokens</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                High contrast ratios (forest green #173F35 on ivory #F8F7F1) ensure high legibility under varying lighting.
              </p>
            </Card>

            <Card interactive className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#173F35]">Large Touch Targets</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                Primary elder action buttons are at least 56px in height with generous spacing to eliminate accidental taps.
              </p>
            </Card>

            <Card interactive className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#173F35]">Screen Reader Feedback</h3>
              <p className="text-xs text-[#52605C] leading-relaxed">
                aria-live polite regions immediately announce status confirmations to assistive screen readers.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* G. PRIVACY & SECURITY SECTION (Universal Card Interactions) */}
      <section className="py-20 bg-[#F8F7F1] border-t border-[#DCE9DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6C9B8B]">
              Privacy &amp; Data Isolation
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#173F35] font-heading">
              Your family's care information remains private.
            </h2>
            <p className="text-base sm:text-lg text-[#52605C]">
              Built with server-enforced security boundaries and authenticated circle permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <Card interactive className="space-y-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#173F35] text-white flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-[#DCE9DF]" />
              </div>
              <h3 className="text-xl font-bold text-[#173F35] font-heading">Invite-Guarded Circles</h3>
              <p className="text-sm text-[#52605C] leading-relaxed">
                Care circles require an explicit Circle ID and a single-use invite code to join, preventing unauthorised access to patient profiles.
              </p>
            </Card>

            <Card interactive className="space-y-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#173F35] text-white flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-[#DCE9DF]" />
              </div>
              <h3 className="text-xl font-bold text-[#173F35] font-heading">Server-Enforced Roles</h3>
              <p className="text-sm text-[#52605C] leading-relaxed">
                Roles are stored authoritatively in Firestore members documents. Cloud Firestore Security Rules reject any client tampering attempts.
              </p>
            </Card>

            <Card interactive className="space-y-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#173F35] text-white flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#DCE9DF]" />
              </div>
              <h3 className="text-xl font-bold text-[#173F35] font-heading">Deterministic Integrity</h3>
              <p className="text-sm text-[#52605C] leading-relaxed">
                Dose logs are tied to deterministic timestamps, guaranteeing that double-taps or network retries never alter clinical dose frequency.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* H. REFINED DARK GREEN CTA */}
      <section className="py-20 bg-[#173F35] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#DCE9DF_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
          <div className="w-16 h-16 rounded-[20px] bg-white/10 flex items-center justify-center mx-auto border border-white/20">
            <BrandLogo variant="symbol" size="md" theme="light" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl font-extrabold font-heading tracking-tight">
              Better connected care starts here.
            </h2>
            <p className="text-base sm:text-lg text-white/80 max-w-xl mx-auto font-normal leading-relaxed">
              Empower older adults with independent medication routines, and give families lasting peace of mind.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="secondary"
              size="large"
              onClick={() => navigate(currentUser && member ? '/dashboard' : '/signup')}
              className="w-full sm:w-auto font-bold text-base px-8 bg-white text-[#173F35] hover:bg-[#EEF4EF] shadow-md"
            >
              {currentUser && member ? 'Go to Your Dashboard' : 'Get Started with Sahaara'}
            </Button>
            {!currentUser && (
              <Button
                variant="ghost"
                size="large"
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto font-bold text-base px-8 text-white border border-white/30 hover:bg-white/10"
              >
                Existing Member Sign In
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* I. POLISHED FOOTER */}
      <footer className="bg-white border-t border-[#DCE9DF] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-left">
            <div className="md:col-span-2 space-y-3">
              <BrandLogo variant="horizontal" size="md" showTagline />
              <p className="text-xs text-[#52605C] max-w-sm leading-relaxed mt-2">
                Sahaara is an elderly care &amp; medication coordination platform dedicated to trust, safety, independence, and connection.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#173F35]">Platform</span>
              <ul className="space-y-2 text-xs text-[#52605C] font-semibold">
                <li><a href="#about" className="hover:text-[#173F35]">About</a></li>
                <li><a href="#how-it-works" className="hover:text-[#173F35]">How It Works</a></li>
                <li><a href="#features" className="hover:text-[#173F35]">Features</a></li>
                <li><a href="#accessibility" className="hover:text-[#173F35]">Accessibility</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#173F35]">Support &amp; Community</span>
              <ul className="space-y-2 text-xs text-[#52605C] font-semibold">
                <li>
                  <button onClick={() => navigate('/faq')} className="hover:text-[#173F35] cursor-pointer">
                    Help &amp; FAQ
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/contact')} className="hover:text-[#173F35] cursor-pointer">
                    Contact &amp; Support
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#DCE9DF] flex flex-col sm:flex-row items-center justify-between text-xs text-[#52605C] gap-4">
            <p>&copy; {new Date().getFullYear()} Sahaara Healthcare Platform. All rights reserved.</p>
            <div className="flex items-center gap-4 text-[#52605C] font-semibold">
              <button onClick={() => navigate('/faq')} className="hover:text-[#173F35]">Privacy &amp; Terms FAQ</button>
              <span>&middot;</span>
              <span>Patient Data Transparency</span>
              <span>&middot;</span>
              <span>Role-Based Access</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
