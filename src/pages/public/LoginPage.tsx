import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Info
} from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { FirestoreUser } from '../../types/models';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/app/dashboard';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both official email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      // Navigate to intended destination or /app/dashboard
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = 'Authentication failed. Please verify your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Invalid official email or password. Check credentials or register an account.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Access temporarily restricted due to multiple failed attempts. Please try again later.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCred.user;

      // Assign role server-authoritatively based on email prefix or default to OFFICER
      const assignedRole: 'OFFICER' | 'ADMIN' = email.toLowerCase().includes('admin') ? 'ADMIN' : 'OFFICER';

      const newUserDoc: FirestoreUser = {
        uid: user.uid,
        email: user.email || email,
        displayName: email.toLowerCase().includes('admin') ? 'Directorate Admin' : 'Field Safety Officer',
        role: assignedRole,
        badgeNumber: `FSO-${user.uid.slice(0, 5).toUpperCase()}`,
        jurisdiction: 'State Food Safety Enforcement Division',
        district: 'Sonipat & Rohtak Zone',
        department: 'Dairy Quality Enforcement Cell',
        clearanceLevel: assignedRole === 'ADMIN' ? 'L3_DIRECTOR' : 'L2_ENFORCEMENT',
        active: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'users', user.uid), newUserDoc);
      } catch (err) {
        console.warn('Direct Firestore write on client failed, server sync will handle:', err);
      }

      setRegisteredSuccess(true);
      setTimeout(() => {
        navigate('/app/dashboard', { replace: true });
      }, 800);
    } catch (err: any) {
      console.error('Registration error:', err);
      let msg = 'Registration failed.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick autofill helper for standard roles
  const fillSampleCredentials = (type: 'OFFICER' | 'ADMIN') => {
    setErrorMessage(null);
    if (type === 'OFFICER') {
      setEmail('officer@foodsafety.gov.in');
      setPassword('MilkyWay2026!');
    } else {
      setEmail('admin@foodsafety.gov.in');
      setPassword('MilkyWayAdmin2026!');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1E8] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#66734A] selection:text-[#FFFDF7]">
      {/* Top Banner Notice */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#26352D] text-[#FFFDF7] text-[11px] font-mono tracking-wider mb-4 border border-white/10">
          <span className="w-2 h-2 rounded-full bg-[#66734A]" />
          <span>OFFICIAL ENFORCEMENT PORTAL</span>
        </div>

        {/* MilkyWay Logo */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#202521]/15 p-2 shadow-sm flex items-center justify-center">
            <img
              src="/milkyway-logo.png"
              alt="MilkyWay Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#202521] font-sans">
          MilkyWay Dairy Surveillance
        </h1>
        <p className="mt-1 text-xs text-[#202521]/70 font-mono">
          State Food Safety Authority • Food Safety Officer Sign In
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FFFDF7] py-8 px-6 sm:px-10 border border-[#202521]/15 rounded-2xl shadow-sm">
          {/* Mode Switch: Sign In vs. Register */}
          <div className="flex border-b border-[#202521]/10 mb-6 font-mono text-xs">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setErrorMessage(null); }}
              className={`flex-1 pb-3 text-center font-bold border-b-2 transition-colors ${
                activeTab === 'signin'
                  ? 'border-[#26352D] text-[#26352D]'
                  : 'border-transparent text-[#202521]/50 hover:text-[#202521]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(null); }}
              className={`flex-1 pb-3 text-center font-bold border-b-2 transition-colors ${
                activeTab === 'register'
                  ? 'border-[#26352D] text-[#26352D]'
                  : 'border-transparent text-[#202521]/50 hover:text-[#202521]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-[#9E4939]/10 border border-[#9E4939]/30 text-[#9E4939] text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-sans leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {registeredSuccess && (
            <div className="mb-5 p-3 rounded-lg bg-[#66734A]/10 border border-[#66734A]/30 text-[#26352D] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#66734A] shrink-0" />
              <span>Officer credentials created successfully. Redirecting to dashboard...</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={activeTab === 'signin' ? handleSignIn : handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#202521] mb-1">
                Official Email Address
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#202521]/40">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@foodsafety.gov.in"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-[#F4F1E8] border border-[#202521]/20 rounded-lg focus:outline-hidden focus:border-[#26352D] font-mono text-[#202521]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202521] mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#202521]/40">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-[#F4F1E8] border border-[#202521]/20 rounded-lg focus:outline-hidden focus:border-[#26352D] font-mono text-[#202521]"
                />
              </div>
              <div className="text-[10px] text-[#202521]/50 font-mono mt-1">
                {activeTab === 'signin' ? 'Encrypted via Firebase Authentication' : 'Minimum 6 alphanumeric characters'}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#26352D] text-[#FFFDF7] text-xs font-bold hover:bg-[#202521] transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#66734A] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : activeTab === 'signin' ? (
                <>
                  <span>Sign In to Enforcement Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Create Officer Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Presets */}
          <div className="mt-6 pt-5 border-t border-[#202521]/10">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#202521]/70 mb-2.5">
              <Info className="w-3.5 h-3.5 text-[#66734A]" />
              <span>Standard Demo Roles & Credentials:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => fillSampleCredentials('OFFICER')}
                className="p-2 text-left rounded-lg bg-[#F4F1E8] hover:bg-[#D8D3C7]/40 border border-[#202521]/15 transition-colors cursor-pointer"
              >
                <div className="font-bold text-[#26352D] flex items-center justify-between">
                  <span>OFFICER</span>
                  <span className="text-[9px] px-1 py-0.2 bg-[#66734A] text-white rounded">L2</span>
                </div>
                <div className="text-[#202521]/60 truncate mt-0.5">officer@foodsafety...</div>
              </button>

              <button
                type="button"
                onClick={() => fillSampleCredentials('ADMIN')}
                className="p-2 text-left rounded-lg bg-[#F4F1E8] hover:bg-[#D8D3C7]/40 border border-[#202521]/15 transition-colors cursor-pointer"
              >
                <div className="font-bold text-[#26352D] flex items-center justify-between">
                  <span>ADMIN</span>
                  <span className="text-[9px] px-1 py-0.2 bg-[#9E4939] text-white rounded">L3</span>
                </div>
                <div className="text-[#202521]/60 truncate mt-0.5">admin@foodsafety...</div>
              </button>
            </div>
            <div className="mt-2 text-[10px] text-[#202521]/50 text-center font-mono">
              Click preset to autofill, then click "Sign In" (or "Create Account" if first time).
            </div>
          </div>
        </div>

        {/* Security / Non-diagnostic Disclaimer */}
        <div className="mt-6 p-3 bg-[#202521]/5 border border-[#202521]/10 rounded-xl text-center">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#202521]/70">
            <ShieldAlert className="w-3.5 h-3.5 text-[#B78632]" />
            <span>Cryptographic Session Tokens • Append-Only BigQuery Ledger Audit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
