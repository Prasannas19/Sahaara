import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { BrandLogo } from '../ui/BrandLogo';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  HelpCircle,
  Shield,
  Users,
  Pill,
  Clock,
  Eye,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: FaqItem[];
}

export const HelpFaqPage: React.FC = () => {
  const { navigate } = useRouter();
  const { currentUser, member } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('getting-started');
  const [expandedFaq, setExpandedFaq] = useState<string | null>('getting-started-0');

  const categories: FaqCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: HelpCircle,
      items: [
        {
          q: 'What is Sahaara?',
          a: 'Sahaara is an elderly care and daily medication routine management platform. It allows elderly individuals to manage their daily medications through a clear, large-type interface, while giving authorised family members and caretakers real-time transparency and coordination tools.',
        },
        {
          q: 'Is an account required to use Sahaara?',
          a: 'Yes. To maintain patient privacy and data isolation, every participant must create a personal account (email/password) and connect to a private Care Circle.',
        },
      ],
    },
    {
      id: 'creating-circle',
      title: 'Creating a Care Circle',
      icon: Users,
      items: [
        {
          q: 'How does an elder establish a Care Circle?',
          a: 'During registration, choose "Create Circle (Elder)". Enter your name, account details, and preferred greeting. Sahaara automatically creates your private circle and gives you its Circle ID. You can then create a single-use invite code for each person you want to add from the Care Circle menu.',
        },
        {
          q: 'Where do I find my Circle ID to share with family?',
          a: 'Once signed in, click on the "Care Circle" button in the top navigation header. A modal will appear showing your Circle ID with a convenient one-click copy button.',
        },
      ],
    },
    {
      id: 'joining-circle',
      title: 'Joining an Existing Circle',
      icon: KeyRound,
      items: [
        {
          q: 'How do family members or caretakers connect to an elder?',
          a: 'Select "Join Existing Circle" on the signup page. Enter your details, paste the Circle ID provided by the elder or a caretaker, and enter the single-use invite code they created for you. Your invite code already sets your role (Caretaker or Family Viewer).',
        },
        {
          q: 'What happens if I enter the wrong invite code?',
          a: 'Each invite code is single-use and tied to one role. If the Circle ID or invite code does not match an unused invite, the join request is rejected immediately and you can ask the elder or caretaker for a fresh code.',
        },
      ],
    },
    {
      id: 'medication-management',
      title: 'Medication Management',
      icon: Pill,
      items: [
        {
          q: 'Who can add or update medications?',
          a: 'Primary Caretakers (and the Elder) have full permission to add new medications, set fixed daily scheduled times (e.g. 08:00, 20:00), edit instructions, deactivate prescriptions, or delete medications.',
        },
        {
          q: 'Can photo references be included for pills?',
          a: 'Yes. Caretakers can provide an image URL when adding or editing a prescription. If provided, the photo appears directly on the elder\'s Next Medication Due card for easy visual recognition.',
        },
      ],
    },
    {
      id: 'dose-tracking',
      title: 'Dose Tracking & Duplicate Prevention',
      icon: Clock,
      items: [
        {
          q: 'What dose actions can an elder record?',
          a: 'Elders can mark any scheduled medication slot as Taken, Skipped, or Not Sure using large, high-contrast action buttons.',
        },
        {
          q: 'How does Sahaara prevent duplicate logs if a button is double-tapped?',
          a: 'Every dose event uses a deterministic event identifier formatted as {medicationId}_{scheduledAtISO}. Tapping a button multiple times or retrying a network request simply merges with the existing document, guaranteeing zero duplicate records.',
        },
      ],
    },
    {
      id: 'caretaker-permissions',
      title: 'Caretaker Permissions',
      icon: CheckCircle2,
      items: [
        {
          q: 'What capabilities does a Caretaker have?',
          a: 'Caretakers have full access to view the elder\'s daily schedule, log doses on behalf of the elder if assistance was provided, manage the complete medication directory, and open an "Elder View Preview" to inspect the patient\'s exact screen.',
        },
      ],
    },
    {
      id: 'family-permissions',
      title: 'Family Viewer Permissions',
      icon: Eye,
      items: [
        {
          q: 'Can Family Viewers edit medications or delete history?',
          a: 'No. Family Viewers have strict, server-enforced read-only permissions. They can view today\'s schedule and recorded dose statuses for peace of mind, but cannot edit prescriptions, delete logs, or modify member roles.',
        },
      ],
    },
    {
      id: 'account-security',
      title: 'Account and Security',
      icon: Shield,
      items: [
        {
          q: 'How are roles and permissions enforced?',
          a: 'Permissions are enforced server-side via Cloud Firestore Security Rules based on each user\'s authoritative members/{uid} document. Client-side modifications cannot bypass these security constraints.',
        },
        {
          q: 'How do I log out of my account?',
          a: 'Click on your user profile avatar in the top right of the dashboard header and select "Sign Out".',
        },
      ],
    },
  ];

  const currentCategoryObj = categories.find((c) => c.id === activeCategory) || categories[0];

  return (
    <div className="min-h-screen bg-[#F8F7F1] text-[#25312E] flex flex-col font-sans">
      {/* Header Bar */}
      <header className="border-b border-[#DCE9DF] bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate(currentUser && member ? '/dashboard' : '/')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#173F35] rounded-[8px]"
          >
            <BrandLogo variant="horizontal" size="md" showTagline={false} />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(currentUser && member ? '/dashboard' : '/')}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#173F35] hover:bg-[#EEF4EF] px-4 py-2 rounded-[8px] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentUser && member ? 'Back to Dashboard' : 'Back to Home'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left space-y-12">
        {/* Page Title */}
        <div className="space-y-3 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6C9B8B] bg-[#EEF4EF] px-3 py-1 rounded-[6px]">
            Help Center &amp; Documentation
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#173F35] font-heading tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-base text-[#52605C] leading-relaxed">
            Everything you need to know about setting up circles, managing medications, and tracking doses on Sahaara.
          </p>
        </div>

        {/* Categories Sidebar + Accordion Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Category Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <h2 className="text-xs font-bold text-[#52605C] uppercase tracking-wider px-3 mb-2">
              Browse Topics
            </h2>
            <div className="bg-white rounded-[20px] p-2 border border-[#DCE9DF] shadow-xs space-y-1">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setExpandedFaq(`${cat.id}-0`);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-[12px] text-sm font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#173F35] text-white shadow-xs'
                        : 'text-[#25312E] hover:bg-[#EEF4EF]'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#6C9B8B]'}`} />
                    <span>{cat.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-5 rounded-[16px] bg-[#EEF4EF] border border-[#DCE9DF] text-xs text-[#52605C] space-y-2 mt-4">
              <p className="font-bold text-[#173F35]">Need further assistance?</p>
              <p>Visit our dedicated Contact page to submit feedback or ask questions.</p>
              <Button
                variant="secondary"
                size="normal"
                onClick={() => navigate('/contact')}
                className="w-full text-xs font-bold mt-1"
              >
                Go to Contact &amp; Support
              </Button>
            </div>
          </div>

          {/* Accordion Questions (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#DCE9DF]">
              <h2 className="text-xl font-bold text-[#173F35] font-heading">
                {currentCategoryObj.title}
              </h2>
              <span className="text-xs text-[#52605C] font-semibold">({currentCategoryObj.items.length} questions)</span>
            </div>

            <div className="space-y-3">
              {currentCategoryObj.items.map((item, idx) => {
                const faqKey = `${currentCategoryObj.id}-${idx}`;
                const isExpanded = expandedFaq === faqKey;
                return (
                  <Card
                    key={faqKey}
                    interactive
                    className="p-0 overflow-hidden border border-[#DCE9DF]"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isExpanded ? null : faqKey)}
                      className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-[#173F35] text-base cursor-pointer hover:bg-[#EEF4EF]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#173F35]"
                      aria-expanded={isExpanded}
                    >
                      <span className="leading-snug">{item.q}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 shrink-0 text-[#173F35]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 shrink-0 text-[#52605C]" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-[#52605C] leading-relaxed border-t border-[#DCE9DF]/40 bg-[#F8F7F1]/60">
                        {item.a}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DCE9DF] bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#52605C] gap-3">
          <p>&copy; {new Date().getFullYear()} Sahaara Healthcare Platform. All rights reserved.</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/contact')} className="hover:text-[#173F35] cursor-pointer">
              Contact &amp; Support
            </button>
            <span>&middot;</span>
            <button onClick={() => navigate('/')} className="hover:text-[#173F35] cursor-pointer">
              Home
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
