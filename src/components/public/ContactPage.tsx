import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { BrandLogo } from '../ui/BrandLogo';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { submitContactInquiry } from '../../services/contactService';

export const ContactPage: React.FC = () => {
  const { navigate } = useRouter();
  const { currentUser, member } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Auto-dismiss the success toast after 5 seconds
  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setLoading(true);
    try {
      // Real backend submission to Firestore collection contactInquiries
      await submitContactInquiry({
        name,
        email,
        subject,
        message,
      });

      // Show success toast only after successful backend persistence
      setShowToast(true);

      // Reset form fields
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit your message. Please try again.';
      setError(msg);
      // Preserves entered information on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F1] text-[#25312E] flex flex-col font-sans">
      {/* Toast Notification Container */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-[#173F35] text-white px-5 py-3.5 rounded-[12px] shadow-[0_8px_24px_rgba(23,63,53,0.25)] border border-[#DCE9DF]/30 animate-in fade-in slide-in-from-top-3 duration-300"
        >
          <div className="w-6 h-6 rounded-full bg-[#DCE9DF] text-[#173F35] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-sm font-semibold tracking-wide">
            Your message has been submitted successfully.
          </p>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="ml-3 text-white/70 hover:text-white text-xs font-bold p-1 cursor-pointer"
            aria-label="Dismiss message"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header Bar */}
      <header className="border-b border-[#DCE9DF] bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate(currentUser && member ? '/dashboard' : '/')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#173F35] rounded-[8px]"
            aria-label="Sahaara Home"
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left space-y-10">
        <div className="space-y-3 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6C9B8B] bg-[#EEF4EF] px-3 py-1 rounded-[6px]">
            Support &amp; Community Feedback
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#173F35] font-heading tracking-tight">
            Contact Sahaara Support
          </h1>
          <p className="text-base text-[#52605C] leading-relaxed">
            Have questions about setting up a Care Circle, managing prescriptions, or accessibility settings? Send us your inquiry below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Info cards (4 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card interactive className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-[12px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#173F35]">Frequently Asked Questions</h3>
              <p className="text-sm text-[#52605C] leading-relaxed">
                Before submitting an inquiry, check our searchable Help &amp; FAQ center for immediate answers regarding circle IDs, roles, and duplicate prevention.
              </p>
              <Button
                variant="secondary"
                size="normal"
                onClick={() => navigate('/faq')}
                className="w-full text-xs font-bold"
              >
                Browse Help &amp; FAQs
              </Button>
            </Card>

            <Card interactive className="p-6 space-y-3 bg-[#EEF4EF] border-[#DCE9DF]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#173F35]">
                <Shield className="w-4 h-4 text-[#6C9B8B]" />
                <span>Security &amp; Privacy Standards</span>
              </div>
              <p className="text-xs text-[#52605C] leading-relaxed">
                Your messages and health questions are handled in strict confidentiality. Inquiries are stored in private, protected Firestore storage and accessible only by authorised support coordinators.
              </p>
            </Card>
          </div>

          {/* Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="p-8 sm:p-10 border border-[#DCE9DF]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-[#173F35] font-heading mb-2">
                  Send an Inquiry or Feedback
                </h2>

                {error && (
                  <div
                    role="alert"
                    className="p-4 rounded-[8px] bg-[#F2ECEC] border border-[#8F2D2D]/30 text-[#8F2D2D] text-sm font-medium flex items-center gap-2"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Full Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    required
                  />

                  <Input
                    label="Your Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <Input
                  label="Subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Question about Care Circle roles"
                  required
                />

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#25312E] block">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe how we can assist you..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-[8px] bg-white border border-[#DCE9DF] focus:border-[#173F35] focus:ring-2 focus:ring-[#173F35] text-[#25312E] text-sm focus:outline-none placeholder:text-[#52605C]/60"
                  />
                  <p className="text-[11px] text-[#52605C]">
                    Minimum 10 characters.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    isLoading={loading}
                    disabled={loading}
                    className="w-full sm:w-auto font-bold px-8 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loading ? 'Submitting...' : 'Submit Message'}</span>
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DCE9DF] bg-white py-8 text-center text-xs text-[#52605C]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Sahaara Healthcare Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/faq')} className="hover:text-[#173F35] font-semibold cursor-pointer">
              Help &amp; FAQ
            </button>
            <span>&middot;</span>
            <button onClick={() => navigate('/')} className="hover:text-[#173F35] font-semibold cursor-pointer">
              Platform Overview
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
