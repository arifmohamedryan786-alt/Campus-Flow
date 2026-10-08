import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Percent, AlertTriangle, CheckCircle2, TrendingUp, HelpCircle, Plus, Minus } from 'lucide-react';

export default function Attendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const res = await api.getAttendance();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const handleMark = async (subjectId, status) => {
    try {
      const res = await api.markAttendance(subjectId, status);
      setActionMessage(res.message);
      setTimeout(() => setActionMessage(''), 4000);
      loadAttendanceData();
    } catch (err) {
      setError(err.message || 'Failed to mark attendance.');
    }
  };

  if (loading && !data) {
    return (
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-500 mt-3">Calculating attendance analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
        {error}
      </div>
    );
  }

  const { overall, subjects, targetPct = 75 } = data;
  const lowAttendanceSubjects = subjects.filter(s => s.percentage < targetPct);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor subject-wise attendance and calculate target class predictions
        </p>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Overall Attendance Summary Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Attendance Rate</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              overall.percentage >= targetPct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {overall.percentage >= targetPct ? 'Safe Zone' : `Below ${targetPct}% Requirement`}
            </span>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-extrabold text-slate-900">{overall.percentage}%</span>
            <span className="text-xs font-medium text-slate-500">
              ({overall.presentClasses} attended / {overall.totalClasses} total lectures)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md bg-slate-100 h-3 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overall.percentage >= targetPct ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(overall.percentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Forecast Card */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl max-w-sm w-full">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Overall Forecast</span>
          </div>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {overall.forecast.statusMessage}
          </p>
        </div>
      </div>

      {/* Risk Warning Alert if any subject < targetPct */}
      {lowAttendanceSubjects.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold">Attendance Warning (&lt; {targetPct}% Target)</h3>
            <p className="text-xs text-amber-800 mt-1">
              You have {lowAttendanceSubjects.length} subject(s) below the mandated {targetPct}% attendance threshold. Please prioritize attending these classes to avoid exam eligibility restrictions.
            </p>
          </div>
        </div>
      )}

      {/* Attendance Forecast Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Attendance Forecast & Predictions</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculated dynamically using real-time database figures against the {targetPct}% requirement
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
            Target: {targetPct}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((sub) => (
            <div
              key={`pred-${sub.id}`}
              className={`p-4 rounded-xl border ${
                sub.forecast.isBelowTarget
                  ? 'border-rose-200 bg-rose-50/50'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600">{sub.code}</span>
                <span className={`text-xs font-bold ${sub.forecast.isBelowTarget ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {sub.percentage}%
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1">{sub.name}</h4>
              <p className="text-xs text-slate-600 mt-2 font-medium">
                {sub.forecast.statusMessage}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Subject-wise Cards & Marking Tools */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Subject Wise Attendance Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-blue-300 transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {sub.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{sub.name}</h3>
                  <p className="text-xs text-slate-500">{sub.faculty}</p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${sub.percentage >= targetPct ? 'text-slate-900' : 'text-rose-600'}`}>
                    {sub.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${sub.percentage >= targetPct ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Present: {sub.present_classes}</span>
                  <span>Absent: {sub.absent_classes}</span>
                  <span>Total: {sub.total_classes}</span>
                </div>
              </div>

              {/* Quick Mark Attendance for testing */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-400">Log Class:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleMark(sub.id, 'present')}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Present</span>
                  </button>
                  <button
                    onClick={() => handleMark(sub.id, 'absent')}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Absent</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
