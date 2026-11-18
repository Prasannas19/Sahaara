import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../firebase/config';
import { BrandLogo } from '../ui/BrandLogo';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ArrowLeft,
  KeyRound,
  UserCheck,
  HeartHandshake,
  Lock,
  Users,
} from 'lucide-react';

export interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signin' }) => {
  const { navigate } = useRouter();
  const { reloadMember } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [regType, setRegType] = useState<'create' | 'join'>('create');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [elderName, setElderName] = useState('');
  const [joinCircleId, setJoinCircleId] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInfo, setCreatedInfo] = useState<{ circleId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await reloadMember();
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      if (
        msg.includes('user-not-found') ||
        msg.includes('invalid-credential') ||
        msg.includes('wrong-password')
      ) {
        setError('Incorrect email or password. Please verify and try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || password.length < 6) {
      setError('Please enter a valid email and a password of at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;
      // Firestore is only needed once an account is actually being created,
      // so it is loaded here rather than with the sign-in page.
      const { createCircleAndMember } = await import('../../services/circleService');

      if (regType === 'create') {
        const elderNameToUse = elderName.trim() || name.trim();
        const { circle } = await createCircleAndMember({
          userId: uid,
          userName: name.trim(),
          userEmail: email.trim(),
          elderName: elderNameToUse,
        });

        setCreatedInfo({
          circleId: circle.circleId,
        });
      } else {
        if (!joinCircleId.trim() || !joinInviteCode.trim()) {
          throw new Error('Please enter both the Circle ID and the Invite Code shared with you.');
        }
        const { joinCircleWithInvite } = await import('../../services/inviteService');
        await joinCircleWithInvite({
          userId: uid,
          userName: name.trim(),
          userEmail: email.trim(),
          circleId: joinCircleId.trim(),
          inviteCode: joinInviteCode.trim(),
        });
        await reloadMember();
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterDashboard = async () => {
    await reloadMember();
    navigate('/dashboard');
  };

  const copyDetails = () => {
    if (!createdInfo) return;
    navigator.clipboard.writeText(`Sahaara Circle ID: ${createdInfo.circleId}\nShare this ID with the people you want to invite, then send each of them their own invite code from the Care Circle menu.`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic left-panel context content based on active mode
  const getLeftPanelContent = () => {
    if (mode === 'signin') {
      return {
        eyebrow: 'SECURE AUTHENTICATION',
        heading: 'Welcome back to your Care Circle.',
        description: 'Sign in to access your daily medication routine, review care circle updates, or coordinate care with your family.',
        cardTitle: 'Role-Based Transparency',
        cardSubtitle: 'Verified permissions &middot; Private Circle',
        bullets: [
          'Elder: Clear today routine & 56px action keys',
          'Caretaker: Comprehensive schedule & appointment control',
          'Family: Read-only adherence updates & reassurance',
        ],
        icon: HeartHandshake,
      };
    }

    if (regType === 'create') {
      return {
        eyebrow: 'CREATE A NEW CARE CIRCLE',
        heading: 'Start your care circle with confidence.',
        description: 'Create your personal care space, manage your medication routine and invite trusted family members or caretakers to support you.',
        cardTitle: 'Care Circle Architecture',
        cardSubtitle: 'How your circle coordinates',
        bullets: [
          'Elder: Owns and remains central to the care circle.',
          'Caretaker: Can help manage medication schedules and appointments.',
          'Family: Can stay informed through authorised read-only access.',
        ],
        icon: UserCheck,
      };
    }

    // Join with a single-use invite code
    return {
      eyebrow: 'JOIN AN EXISTING CARE CIRCLE',
      heading: 'Be there for the people who matter.',
      description: 'Join an existing Sahaara Care Circle using the Circle ID and invite code shared by the elder or a caretaker in that circle.',
      cardTitle: 'Secure Invitation Verification',
      cardSubtitle: 'Single-use invite code entry',
      bullets: [
        'Caretaker: Help manage medication schedules, appointments and care follow-ups.',
        'Family Viewer: View authorised medication information, appointments and care activity.',
        'Secure invitation: Each invite code works exactly once, for one named role, and cannot be reused.',
      ],
      icon: Users,
    };
  };

  const panel = getLeftPanelContent();
  const IconComponent = panel.icon;

  return (
    <div className="min-h-screen bg-[#F8F7F1] text-[#25312E] flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Return to Home Link */}
      <div className="max-w-5xl w-full mx-auto mb-5">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#52605C] hover:text-[#173F35] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Sahaara Platform</span>
        </button>
      </div>

      <div className="max-w-5xl w-full mx-auto bg-white rounded-[24px] shadow-[0_12px_40px_rgba(23,63,53,0.06)] border border-[#DCE9DF] overflow-hidden grid grid-cols-1 md:grid-cols-12 sm:min-h-[620px]">
        {/* LEFT PANEL: Forest-Green Brand Panel (CogniCrew structural composition) */}
        <div className="hidden sm:flex md:col-span-5 bg-[#173F35] text-white p-6 sm:p-10 lg:p-12 flex-col justify-between relative overflow-hidden text-left">
          <div className="absolute inset-0 bg-[radial-gradient(#DCE9DF_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          <div className="relative z-10 space-y-5">
            <BrandLogo variant="horizontal" size="md" theme="light" showTagline={false} />

            <div className="pt-4 space-y-3">
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-[#DCE9DF] bg-white/10 px-2.5 py-1 rounded-[6px]">
                {panel.eyebrow}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight leading-snug">
                {panel.heading}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal">
                {panel.description}
              </p>
            </div>
          </div>

          {/* Contextual Supporting Information Card */}
          <div className="relative z-10 my-6 p-4 sm:p-5 rounded-[16px] bg-white/10 border border-white/20 backdrop-blur-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#DCE9DF] text-[#173F35] flex items-center justify-center shrink-0">
                <IconComponent className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">{panel.cardTitle}</p>
                <p className="text-[11px] text-white/70" dangerouslySetInnerHTML={{ __html: panel.cardSubtitle }} />
              </div>
            </div>

            <div className="pt-2.5 border-t border-white/15 space-y-2 text-xs text-white/90">
              {panel.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#DCE9DF] shrink-0 mt-0.5" />
                  <span className="leading-snug">{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-white/60 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#DCE9DF] shrink-0" />
            <span>256-bit SSL encrypted &middot; Zero health data profiling</span>
          </div>
        </div>

        {/* RIGHT PANEL: Warm-White / Ivory Form Surface */}
        <div className="md:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center text-left bg-white">
          {/* Compact brand header shown only on phones, where the marketing panel is hidden */}
          <div className="sm:hidden text-center mb-6">
            <div className="flex justify-center mb-2">
              <BrandLogo variant="horizontal" size="md" showTagline={false} />
            </div>
            <p className="text-xs text-[#52605C]">Care that connects. Support that matters.</p>
          </div>
          {createdInfo ? (
            /* Circle Created Confirmation State */
            <div className="text-center space-y-6 max-w-md mx-auto animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-[20px] bg-[#EEF4EF] text-[#173F35] flex items-center justify-center mx-auto shadow-xs border border-[#DCE9DF]">
                <ShieldCheck className="w-8 h-8 text-[#173F35]" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6C9B8B] bg-[#EEF4EF] px-3 py-1 rounded-[6px]">
                  Registration Complete
                </span>
                <h3 className="text-2xl font-bold text-[#173F35] font-heading mt-2">
                  Your Sahaara Circle is Ready!
                </h3>
                <p className="text-xs text-[#52605C] mt-2 leading-relaxed">
                  You can now create a single-use invite code for each caretaker or family member from the Care Circle menu. Only someone with an invite code can join this circle.
                </p>
              </div>

              <div className="p-5 rounded-[16px] bg-[#EEF4EF] border border-[#DCE9DF] text-left space-y-3">
                <div>
                  <span className="text-xs font-semibold text-[#52605C] uppercase tracking-wider">Circle ID</span>
                  <p className="font-mono text-base font-bold text-[#173F35] break-all select-all">{createdInfo.circleId}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={copyDetails}
                  className="w-full flex items-center justify-center gap-2 font-bold min-h-[48px]"
                >
                  {copied ? <Check className="w-5 h-5 text-green-700" /> : <Copy className="w-5 h-5" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Circle ID'}</span>
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleEnterDashboard}
                  className="w-full font-bold min-h-[48px]"
                >
                  Enter Today Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto w-full">
              {/* Segmented Auth Navigation Tabs */}
              <div className="flex bg-[#EEF4EF] p-1 rounded-[10px] border border-[#DCE9DF] mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-white text-[#173F35] shadow-xs'
                      : 'text-[#52605C] hover:text-[#173F35]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white text-[#173F35] shadow-xs'
                      : 'text-[#52605C] hover:text-[#173F35]'
                  }`}
                >
                  Create Account / Join
                </button>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 p-4 rounded-[10px] bg-[#F2ECEC] border border-[#8F2D2D]/30 text-[#8F2D2D] text-xs font-medium flex items-center gap-2 animate-in fade-in"
                >
                  <span className="w-2 h-2 rounded-full bg-[#8F2D2D] shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {mode === 'signin' ? (
                /* 4. SIGN-IN SCREEN */
                <form onSubmit={handleSignIn} className="space-y-4">
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                  />

                  <div className="space-y-1 text-left relative">
                    <label className="text-sm font-semibold text-[#25312E]">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                        className="w-full min-h-[48px] px-3.5 pr-12 py-2.5 rounded-[8px] bg-white border border-[#DCE9DF] focus:border-[#173F35] focus:ring-2 focus:ring-[#173F35] text-[#25312E] text-sm focus:outline-none placeholder:text-[#52605C]/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#52605C] hover:text-[#173F35] p-1 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    isLoading={loading}
                    disabled={loading}
                    className="w-full mt-4 font-bold min-h-[48px]"
                  >
                    Sign In to Sahaara
                  </Button>

                  <div className="text-center pt-3 text-xs text-[#52605C]">
                    New to Sahaara?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="font-bold text-[#173F35] underline hover:no-underline cursor-pointer"
                    >
                      Create an account or join a circle
                    </button>
                  </div>
                </form>
              ) : (
                /* 5 & 6. REGISTRATION SCREENS (ELDER VS JOIN WITH PASSCODE) */
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Progressive Mode Selector */}
                  <div className="space-y-1.5 pb-2">
                    <label className="text-xs font-bold text-[#52605C] uppercase tracking-wider block">
                      Account Registration Type
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-[#EEF4EF] rounded-[8px] border border-[#DCE9DF]">
                      <button
                        type="button"
                        onClick={() => setRegType('create')}
                        className={`py-2 px-3 text-xs font-bold rounded-[6px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                          regType === 'create'
                            ? 'bg-[#173F35] text-white shadow-xs'
                            : 'text-[#25312E] hover:bg-white'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Elder (New Circle)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegType('join')}
                        className={`py-2 px-3 text-xs font-bold rounded-[6px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                          regType === 'join'
                            ? 'bg-[#173F35] text-white shadow-xs'
                            : 'text-[#25312E] hover:bg-white'
                        }`}
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Join with Invite Code</span>
                      </button>
                    </div>
                  </div>

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

                  <div className="space-y-1 text-left relative">
                    <label className="text-sm font-semibold text-[#25312E]">
                      Password (min 6 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                        className="w-full min-h-[48px] px-3.5 pr-12 py-2.5 rounded-[8px] bg-white border border-[#DCE9DF] focus:border-[#173F35] focus:ring-2 focus:ring-[#173F35] text-[#25312E] text-sm focus:outline-none placeholder:text-[#52605C]/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#52605C] hover:text-[#173F35] p-1 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 5. ELDER NEW CIRCLE SPECIFIC FIELDS */}
                  {regType === 'create' && (
                    <div className="space-y-3 pt-1 border-t border-[#DCE9DF]/60 animate-in fade-in">
                      <Input
                        label="Elder's Preferred Name (optional)"
                        type="text"
                        value={elderName}
                        onChange={(e) => setElderName(e.target.value)}
                        placeholder="Leave blank if registering for yourself"
                      />

                      <div className="p-3.5 bg-[#EEF4EF] rounded-[10px] border border-[#DCE9DF]">
                        <span className="text-[11px] font-bold text-[#173F35] uppercase tracking-wider block">Invite-only circle</span>
                        <span className="text-xs text-[#52605C]">After your circle is created, generate a single-use invite code for each person you want to add. People can only join with a valid code.</span>
                      </div>
                    </div>
                  )}

                  {/* 6. JOIN WITH INVITE CODE SPECIFIC FIELDS */}
                  {regType === 'join' && (
                    <div className="space-y-3 pt-1 border-t border-[#DCE9DF]/60 animate-in fade-in">
                      <Input
                        label="Care Circle ID"
                        type="text"
                        value={joinCircleId}
                        onChange={(e) => setJoinCircleId(e.target.value)}
                        placeholder="Paste the Circle ID shared with you"
                        required
                      />

                      <Input
                        label="Invite Code"
                        type="text"
                        value={joinInviteCode}
                        onChange={(e) => setJoinInviteCode(e.target.value)}
                        placeholder="e.g. aB3dEf7H-1Q8N4R2W9TK3G6PJ-C"
                        required
                      />

                      <p className="text-xs text-[#52605C] leading-relaxed">
                        Your invite code is single-use and already sets your role (caretaker or family viewer). Ask the elder or a caretaker in the circle if you need one.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    isLoading={loading}
                    disabled={loading}
                    className="w-full mt-4 font-bold min-h-[48px]"
                  >
                    {regType === 'create' ? 'Create Care Circle' : 'Join Care Circle'}
                  </Button>

                  <div className="text-center pt-2 text-xs text-[#52605C]">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="font-bold text-[#173F35] underline hover:no-underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
