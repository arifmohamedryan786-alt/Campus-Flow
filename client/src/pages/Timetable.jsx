import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Calendar, Clock, MapPin, UserCheck, CheckCircle, Hourglass, PlayCircle } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Timetable() {
  const [selectedDay, setSelectedDay] = useState('');
  const [timetable, setTimetable] = useState([]);
  const [currentDay, setCurrentDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTimetable() {
      try {
        setLoading(true);
        const res = await api.getTimetable(selectedDay);
        setTimetable(res.timetable);
        if (!selectedDay && res.currentDay) {
          setCurrentDay(res.currentDay);
        }
      } catch (err) {
        setError(err.message || 'Failed to load timetable.');
      } finally {
        setLoading(false);
      }
    }
    loadTimetable();
  }, [selectedDay]);

  const activeDay = selectedDay || currentDay || 'Monday';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Timetable</h1>
          <p className="text-sm text-slate-500 mt-1">
            Weekly class schedule and lecture room allocations
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white border border-slate-200 p-1 rounded-xl">
          <span className="text-xs font-semibold text-slate-500 px-3">Today is:</span>
          <span className="text-xs font-bold px-3 py-1 rounded-lg bg-blue-100 text-blue-700">
            {currentDay || 'Monday'}
          </span>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedDay('')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedDay === ''
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Days
        </button>
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedDay === day
                ? 'bg-blue-600 text-white shadow-xs'
                : day === currentDay && selectedDay === ''
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {day} {day === currentDay && '(Today)'}
          </button>
        ))}
      </div>

      {/* Timetable List */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500 mt-3">Loading schedule...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      ) : timetable.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Classes Scheduled</h3>
          <p className="text-xs text-slate-500 mt-1">There are no lectures on this day in your timetable database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timetable.map((cls) => (
            <div
              key={cls.id}
              className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all relative overflow-hidden ${
                cls.status === 'Ongoing'
                  ? 'border-amber-400 ring-2 ring-amber-100'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              {/* Top Row: Day & Status */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {cls.day_of_week}
                </span>
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    cls.status === 'Ongoing'
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : cls.status === 'Completed'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {cls.status === 'Ongoing' && <PlayCircle className="w-3.5 h-3.5 mr-1" />}
                  {cls.status === 'Completed' && <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                  {cls.status === 'Upcoming' && <Hourglass className="w-3.5 h-3.5 mr-1" />}
                  <span>{cls.status}</span>
                </span>
              </div>

              {/* Subject Code & Title */}
              <div className="mb-4">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {cls.subject_code}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                  {cls.subject_name}
                </h3>
              </div>

              {/* Details: Faculty, Room, Time */}
              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700">{cls.faculty}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{cls.start_time} - {cls.end_time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{cls.room}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
