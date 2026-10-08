import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Filter,
  X
} from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, completed: 0, overdue: 0 });
  const [subjects, setSubjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'Medium'
  });

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks(filter === 'all' ? '' : filter);
      setTasks(res.tasks);
      setCounts(res.counts);
    } catch (err) {
      setError(err.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await api.getAttendance();
        setSubjects(res.subjects || []);
      } catch (err) {
        // silent
      }
    }
    loadSubjects();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const handleOpenAdd = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      subject_id: subjects[0]?.id || '',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'Medium'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      subject_id: task.subject_id || '',
      due_date: task.due_date,
      priority: task.priority
    });
    setModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.due_date) return;

    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, formData);
      } else {
        await api.createTask(formData);
      }
      setModalOpen(false);
      loadTasks();
    } catch (err) {
      setError(err.message || 'Failed to save task.');
    }
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.computed_status === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTask(task.id, { status: newStatus });
      loadTasks();
    } catch (err) {
      setError(err.message || 'Failed to update task status.');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(id);
      loadTasks();
    } catch (err) {
      setError(err.message || 'Failed to delete task.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task & Coursework Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize assignments, lab submissions, and study goals with priority tracking
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Task</span>
        </button>
      </div>

      {/* Filter Tabs & Badges */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Tasks', count: counts.all },
          { key: 'pending', label: 'Pending', count: counts.pending },
          { key: 'overdue', label: 'Overdue', count: counts.overdue, highlight: true },
          { key: 'completed', label: 'Completed', count: counts.completed },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filter === item.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{item.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                filter === item.key
                  ? 'bg-white/20 text-white'
                  : item.highlight && item.count > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500 mt-3">Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Tasks Found</h3>
          <p className="text-xs text-slate-500 mt-1">There are no tasks matching the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white border rounded-2xl p-4 md:p-5 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                task.computed_status === 'completed'
                  ? 'border-slate-200 bg-slate-50/50 opacity-80'
                  : task.computed_status === 'overdue'
                  ? 'border-rose-200 bg-rose-50/30'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              {/* Checkbox & Task Details */}
              <div className="flex items-start space-x-4">
                <button
                  onClick={() => handleToggleComplete(task)}
                  className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                    task.computed_status === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 hover:border-blue-600 bg-white'
                  }`}
                  aria-label="Toggle Complete"
                >
                  {task.computed_status === 'completed' && <CheckCircle className="w-4 h-4" />}
                </button>

                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h3 className={`text-base font-bold ${
                      task.computed_status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'
                    }`}>
                      {task.title}
                    </h3>

                    {/* Priority Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      task.priority === 'High'
                        ? 'bg-rose-100 text-rose-700'
                        : task.priority === 'Medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {task.priority} Priority
                    </span>

                    {/* Overdue Tag */}
                    {task.computed_status === 'overdue' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white uppercase tracking-wider">
                        Overdue
                      </span>
                    )}

                    {/* Subject Badge */}
                    {task.subject_name && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {task.subject_name}
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{task.description}</p>
                  )}

                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {task.due_date}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  onClick={() => handleOpenEdit(task)}
                  className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                  title="Edit Task"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTask ? 'Edit Task' : 'Create New Coursework Task'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Complete AI Neural Networks Lab"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task instructions or requirements..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-600 h-24"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Related Subject
                  </label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="">General / None</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} - {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-600 bg-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
