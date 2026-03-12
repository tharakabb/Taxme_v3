import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, ArrowRight, CheckCircle, AlertCircle, ChevronLeft, Building2, UserCircle, Briefcase } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export const AuthPage = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1: Account Type, 2: Name, 3: PIN
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [userType, setUserType] = useState('personal');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin, user_type: userType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Auto login after signup
      await handleLogin();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 2 && !name.trim()) {
      setError('Please enter a name');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const renderSignupStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Choose Account Type</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Select how you will use TaxMe</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'personal', label: 'Personal', desc: 'Individual tax filing', icon: UserCircle },
                { id: 'sole_prop', label: 'Sole Prop', desc: 'Business owners', icon: Briefcase },
                { id: 'pvt_ltd', label: 'Pvt Ltd', desc: 'Private companies', icon: Building2 }
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setUserType(type.id);
                    nextStep();
                  }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                    userType === type.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${userType === type.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                    <type.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{type.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{type.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">What's your name?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">This will be your profile name</p>
            </div>
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-lg"
                  placeholder="Enter your name"
                />
              </div>
            </div>
            <button
              onClick={nextStep}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={prevStep} className="w-full text-gray-500 text-sm flex items-center justify-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back to account type
            </button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Set your 4-digit PIN</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Secure your profile with a simple PIN</p>
            </div>
            <div className="flex justify-center gap-4">
              <div className="relative w-full max-w-[200px]">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPin(val);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && pin.length === 4 && handleSignup()}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-center text-2xl tracking-[1em]"
                  placeholder="••••"
                />
              </div>
            </div>
            <button
              onClick={handleSignup}
              disabled={loading || pin.length !== 4}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              {loading ? 'Creating Profile...' : 'Create Profile'}
              {!loading && <CheckCircle className="w-5 h-5" />}
            </button>
            <button onClick={prevStep} className="w-full text-gray-500 text-sm flex items-center justify-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back to name
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 transition-colors relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
      >
        <div className="p-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-none overflow-hidden">
                <img 
                  src="/uploads/logo.png" 
                  alt="TaxMe Logo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-white font-bold text-3xl tracking-tighter">TM</span>';
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">TaxMe</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Sri Lanka's Smart Tax Companion</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-2xl flex items-center gap-3 border border-red-100 dark:border-red-900/30 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin} 
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Profile Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">4-Digit PIN</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-center text-xl tracking-[0.5em]"
                        placeholder="••••"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || pin.length !== 4}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  {loading ? 'Entering...' : 'Enter TaxMe'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {renderSignupStep()}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setStep(1);
                setError('');
              }}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold"
            >
              {isLogin ? "Create a new profile" : "Already have a profile? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
