import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'motion/react';
import { User, Mail, Shield, LogOut, Moon, Sun, Monitor } from 'lucide-react';

export const Settings = () => {
  const { user, logout, checkAuth } = useAuth();
  const { theme, setTheme } = useTheme();
  const [tin, setTin] = useState(user?.tin || '');
  const [periodCode, setPeriodCode] = useState(user?.period_code || '25260');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tin, period_code: periodCode }),
      });
      if (res.ok) {
        setMessage('Profile updated successfully');
        await checkAuth();
      } else {
        setMessage('Failed to update profile');
      }
    } catch (err) {
      setMessage('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinLoading(true);
    setPinMessage('');
    try {
      const res = await fetch('/api/auth/change-pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const data = await res.json();
      if (res.ok) {
        setPinMessage('PIN changed successfully');
        setCurrentPin('');
        setNewPin('');
        setTimeout(() => setShowPinForm(false), 2000);
      } else {
        setPinMessage(data.error || 'Failed to change PIN');
      }
    } catch (err) {
      setPinMessage('Error changing PIN');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-bold">
              {user?.name[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.user_type.replace('_', ' ')} Account</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Appearance Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Appearance</h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Sun className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  theme === 'dark'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Moon className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Dark</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  theme === 'system'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Monitor className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    disabled
                    value={user?.name}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    disabled
                    value={user?.user_type.replace('_', ' ').toUpperCase()}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">TIN (Taxpayer Identification Number)</label>
                <input
                  type="text"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  placeholder="Enter your TIN"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period Code (e.g., 25260 for 2025/26)</label>
                <input
                  type="text"
                  value={periodCode}
                  onChange={(e) => setPeriodCode(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm shadow-indigo-200 dark:shadow-none"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              {message && (
                <p className={`text-sm font-medium ${message.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {message}
                </p>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Security</h3>
            {!showPinForm ? (
              <button 
                onClick={() => setShowPinForm(true)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Change PIN
              </button>
            ) : (
              <form onSubmit={handleChangePin} className="max-w-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="••••"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={pinLoading || currentPin.length !== 4 || newPin.length !== 4}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {pinLoading ? 'Updating...' : 'Update PIN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPinForm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
                {pinMessage && (
                  <p className={`text-sm font-medium ${pinMessage.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {pinMessage}
                  </p>
                )}
              </form>
            )}
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
