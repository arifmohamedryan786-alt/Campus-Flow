import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Lock, Bell, LogOut, CheckCircle2, Save, Target } from 'lucide-react';

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Settings state
  const [settingsData, setSettingsData] = useState({
    email_alerts: true,
    attendance_alerts: true,
    task_reminders: true,
    target_attendance: 75
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.getProfile();
        if (res.settings) {
          setSettingsData({
            email_alerts: Boolean(res.settings.email_alerts),
            attendance_alerts: Boolean(res.settings.attendance_alerts),
            task_reminders: Boolean(res.settings.task_reminders),
            target_attendance: res.settings.target_attendance || 75
          });
        }
      } catch (err) {
        // silent
      }
    }
    loadSettings();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassSuccess('');
    setPassError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }

    setPassLoading(true);

    try {
      await api.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPassSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPassSuccess(''), 4000);
    } catch (err) {
      setPassError(err.message || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSuccess('');
    setSettingsLoading(true);

    try {
      await api.updateSettings(settingsData);
      setSettingsSuccess('Preferences saved successfully!');
      setTimeout(() => setSettingsSuccess(''), 4000);
    } catch (err) {
      // silent
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure security, notifications, and target academic metrics
        </p>
      </div>

      <div className="space-y-6">
        {/* Security / Password Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center space-x-2.5 mb-4">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Security & Password</h2>
              <p className="text-xs text-slate-500">Update your account password</p>
            </div>
          </div>

          {passSuccess && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          {passError && (
            <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {passError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Current Password *
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                New Password *
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
            >
              {passLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Notification Preferences Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center space-x-2.5 mb-4">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Notification Preferences</h2>
              <p className="text-xs text-slate-500">Configure alert thresholds and reminders</p>
            </div>
          </div>

          {settingsSuccess && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{settingsSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-5 max-w-lg">
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">Attendance Risk Alerts</span>
                  <span className="text-xs text-slate-500">Notify when attendance drops below threshold</span>
                </div>
                <input
                  type="checkbox"
                  checked={settingsData.attendance_alerts}
                  onChange={(e) => setSettingsData({ ...settingsData, attendance_alerts: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">Task Due Reminders</span>
                  <span className="text-xs text-slate-500">Receive alerts for upcoming assignment deadlines</span>
                </div>
                <input
                  type="checkbox"
                  checked={settingsData.task_reminders}
                  onChange={(e) => setSettingsData({ ...settingsData, task_reminders: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">Email Digests</span>
                  <span className="text-xs text-slate-500">Send weekly academic progress summary</span>
                </div>
                <input
                  type="checkbox"
                  checked={settingsData.email_alerts}
                  onChange={(e) => setSettingsData({ ...settingsData, email_alerts: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Required Target Attendance Percentage (%)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={settingsData.target_attendance}
                  onChange={(e) => setSettingsData({ ...settingsData, target_attendance: e.target.value })}
                  className="w-32 px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-600"
                />
                <span className="text-xs text-slate-500">Standard college target is 75%</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={settingsLoading}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </form>
        </div>

        {/* Account Session Logout */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sign Out</h3>
            <p className="text-xs text-slate-500 mt-0.5">End your current session safely</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
