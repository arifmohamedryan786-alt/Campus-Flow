import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Percent,
  Calendar,
  CheckSquare,
  Clock,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  MapPin,
  UserCheck,
  Plus
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await api.getDashboard();
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500 mt-4">Loading your campus dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 my-4">
        <p className="font-semibold">Error Loading Dashboard</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const { user, overview, todaysTimetable, aiPriorities } = data;
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {getGreeting()}, {firstName} 👋
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {user?.department} • <span className="font-medium text-slate-700">{user?.year}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/ai-assistant"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI Assistant</span>
          </Link>
          <Link
            to="/tasks"
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance */}
        <Link to="/attendance" className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance</span>
            <div className={`p-2.5 rounded-xl ${overview.overallAttendance >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{overview.overallAttendance}%</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${overview.overallAttendance >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {overview.overallAttendance >= 75 ? 'Safe Zone' : 'Risk Warning'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between group-hover:text-blue-600">
            <span>Target: 75% minimum</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </p>
        </Link>

        {/* Classes Today */}
        <Link to="/timetable" className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classes Today</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{overview.classesTodayCount}</span>
            <span className="text-xs font-medium text-slate-500">Scheduled</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between group-hover:text-blue-600">
            <span>View today's timetable</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </p>
        </Link>

        {/* Pending Tasks */}
        <Link to="/tasks" className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Tasks</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{overview.pendingTasksCount}</span>
            <span className="text-xs font-medium text-slate-500">To do</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between group-hover:text-blue-600">
            <span>Manage coursework tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </p>
        </Link>

        {/* Upcoming Deadlines */}
        <Link to="/tasks?status=pending" className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming Deadlines</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{overview.upcomingDeadlinesCount}</span>
            <span className="text-xs font-medium text-indigo-600 font-semibold">Next 3 days</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between group-hover:text-blue-600">
            <span>View urgent deadlines</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </p>
        </Link>
      </div>

      {/* Main Grid: Today's Priorities & Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Today's Priority */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Today's Priorities</h2>
                  <p className="text-xs text-slate-500">AI-analyzed action items based on deadlines & attendance risk</p>
                </div>
              </div>
              <Link to="/ai-assistant" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Full AI Insights →
              </Link>
            </div>

            {aiPriorities.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No urgent priority items detected for today. You are up to date!
              </div>
            ) : (
              <div className="space-y-3">
                {aiPriorities.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                          {item.tag && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              item.priority === 'High' || item.priority === 'Critical'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{item.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Today's Timetable Preview */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Today's Classes</h2>
              <Link to="/timetable" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Full Timetable →
              </Link>
            </div>

            {todaysTimetable.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>No classes scheduled for today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysTimetable.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-600">{cls.subject_code}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        cls.status === 'Ongoing'
                          ? 'bg-amber-100 text-amber-800 font-bold animate-pulse'
                          : cls.status === 'Completed'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {cls.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{cls.subject_name}</h4>
                    <div className="flex items-center space-x-3 text-xs text-slate-500 mt-2">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cls.start_time} - {cls.end_time}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cls.room}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
