import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../firebase/config';
import {
  createCircleAndMember,
  joinCircleAndCreateMember,
} from '../../services/circleService';
import { generatePasscode } from '../../utils/crypto';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { Card } from '../ui/Card';
import { Heart, UserPlus, LogIn, Shield, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthFlow: React.FC = () => {
  const { reloadMember } = useAuth();
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [regType, setRegType] = useState<'create' | 'join'>('create');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [elderName, setElderName] = useState('');
  const [passcode, setPasscode] = useState(() => generatePasscode());
  const [joinCircleId, setJoinCircleId] = useState('');
  const [joinPasscode, setJoinPasscode] = useState('');
  const [joinRole, setJoinRole] = useState<'caretaker' | 'family'>('caretaker');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInfo, setCreatedInfo] = useState<{ circleId: string; passcode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await reloadMember();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      if (message.includes('user-not-found') || message.includes('invalid-credential')) {
        setError('Invalid email or password. Please verify your credentials.');
      } else {
        setError(message);
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
      setError('Please provide a valid email and a password of at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;

      if (regType === 'create') {
        const elderNameToUse = elderName.trim() || name.trim();
        const { circle } = await createCircleAndMember({
          userId: uid,
          userName: name.trim(),
          userEmail: email.trim(),
          elderName: elderNameToUse,
          passcode: passcode.trim(),
        });

        setCreatedInfo({
          circleId: circle.circleId,
          passcode: passcode.trim(),
        });
      } else {
        if (!joinCircleId.trim() || !joinPasscode.trim()) {
          throw new Error('Please enter both the Circle ID and Passcode to join.');
        }
        await joinCircleAndCreateMember({
          userId: uid,
          userName: name.trim(),
          userEmail: email.trim(),
          circleId: joinCircleId.trim(),
          passcode: joinPasscode.trim(),
          role: joinRole,
        });
        await reloadMember();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeCreated = async () => {
    await reloadMember();
  };

  const copyDetails = () => {
    if (!createdInfo) return;
    navigator.clipboard.writeText(`Sahaara Circle ID: ${createdInfo.circleId}\nPasscode: ${createdInfo.passcode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If new circle was just created, show immediate confirmation with passcode
  if (createdInfo) {
    return (
      <div className="max-w-md mx-auto py-8">
        <Card className="text-center p-8">
          <div className="w-16 h-16 rounded-[16px] bg-[#DCE9DF] flex items-center justify-center text-[#173F35] mx-auto mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#173F35] mb-2 font-heading">
            Your Sahaara Circle is Ready!
          </h2>
          <p className="text-sm text-[#52605C] mb-6">
            Share these credentials with your designated caretakers and family members so they can join your care circle.
          </p>

          <div className="bg-[#EEF4EF] p-4 rounded-[12px] border border-[#DCE9DF] text-left space-y-3 mb-6">
            <div>
              <span className="text-xs font-semibold text-[#52605C] uppercase tracking-wider">Circle ID</span>
              <p className="font-mono text-base font-bold text-[#173F35] break-all">{createdInfo.circleId}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-[#52605C] uppercase tracking-wider">Passcode</span>
              <p className="font-mono text-xl font-bold tracking-widest text-[#173F35]">{createdInfo.passcode}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="secondary"
              onClick={copyDetails}
              className="w-full flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-5 h-5 text-green-700" /> : <Copy className="w-5 h-5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Circle Invite Info'}</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAcknowledgeCreated}
              className="w-full"
            >
              Enter My Today Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-[16px] bg-[#173F35] flex items-center justify-center text-white mx-auto mb-3 shadow-[0_2px_8px_rgba(23,63,53,0.15)]">
          <Heart className="w-7 h-7 fill-white" />
        </div>
        <h1 className="text-3xl font-bold text-[#173F35] font-heading tracking-tight">Sahaara</h1>
        <p className="text-sm text-[#52605C] mt-1">Care that connects. Support that matters.</p>
      </div>

      <Card className="p-6 sm:p-8">
        {/* Sign In vs Register Toggle */}
        <div className="flex border-b border-[#DCE9DF] pb-4 mb-6">
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(null); }}
            className={`flex-1 py-2.5 text-center text-base font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === 'signin'
                ? 'border-[#173F35] text-[#173F35]'
                : 'border-transparent text-[#52605C] hover:text-[#173F35]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 py-2.5 text-center text-base font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === 'register'
                ? 'border-[#173F35] text-[#173F35]'
                : 'border-transparent text-[#52605C] hover:text-[#173F35]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>Join / Create</span>
            </div>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-[8px] bg-[#F2ECEC] border border-[#8F2D2D]/30 text-[#8F2D2D] text-sm font-medium"
          >
            {error}
          </div>
        )}

        {tab === 'signin' ? (
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
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              variant="primary"
              size="large"
              isLoading={loading}
              className="w-full mt-2"
            >
              Sign In to Sahaara
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Circle Options: Create or Join */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#EEF4EF] rounded-[8px] border border-[#DCE9DF]">
              <button
                type="button"
                onClick={() => setRegType('create')}
                className={`py-2 px-3 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
                  regType === 'create'
                    ? 'bg-[#173F35] text-white shadow-xs'
                    : 'text-[#25312E] hover:bg-white'
                }`}
              >
                Create Circle (Elder)
              </button>
              <button
                type="button"
                onClick={() => setRegType('join')}
                className={`py-2 px-3 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
                  regType === 'join'
                    ? 'bg-[#173F35] text-white shadow-xs'
                    : 'text-[#25312E] hover:bg-white'
                }`}
              >
                Join Existing Circle
              </button>
            </div>

            <Input
              label="Your Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              autoComplete="new-password"
            />

            {regType === 'create' ? (
              <>
                <Input
                  label="Elder's Preferred Name (Displays on Dashboard)"
                  type="text"
                  value={elderName}
                  onChange={(e) => setElderName(e.target.value)}
                  placeholder={name ? name : 'e.g. Grandma Rose'}
                  helperText="Leave empty to use your full name."
                />

                <Input
                  label="Circle Passcode (Generated to share with family)"
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                  helperText="Caretakers & family will use this passcode to connect."
                  required
                />
              </>
            ) : (
              <>
                <Input
                  label="Circle ID"
                  type="text"
                  value={joinCircleId}
                  onChange={(e) => setJoinCircleId(e.target.value)}
                  placeholder="Paste the Circle ID provided by the Elder"
                  required
                />

                <Input
                  label="Circle Passcode"
                  type="text"
                  value={joinPasscode}
                  onChange={(e) => setJoinPasscode(e.target.value.toUpperCase())}
                  placeholder="e.g. SAH-492"
                  required
                />

                <Select
                  label="Your Role in this Circle"
                  value={joinRole}
                  onChange={(e) => setJoinRole(e.target.value as 'caretaker' | 'family')}
                  options={[
                    { value: 'caretaker', label: 'Caretaker (Manage medications & track doses)' },
                    { value: 'family', label: 'Family Viewer (Read-only status overview)' },
                  ]}
                />
              </>
            )}

            <Button
              type="submit"
              variant="primary"
              size="large"
              isLoading={loading}
              className="w-full mt-2"
            >
              {regType === 'create' ? 'Create Circle & Continue' : 'Join Circle & Continue'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};
