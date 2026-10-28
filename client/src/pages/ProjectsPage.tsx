import React, { useEffect, useState } from 'react';
import { CheckSquare, Plus, Calendar, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/projects');
      if (res.data.success) {
        setProjects(res.data.projects || []);
        setStatuses(res.data.statuses || []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.post('/api/projects', { title });
      setTitle('');
      fetchProjects();
    } catch (err) {
      console.error('Error creating project task:', err);
    }
  };

  const handleToggleCompleted = async (id: string | number, currentCompleted: boolean) => {
    try {
      await api.put(`/api/projects/${id}`, { is_completed: !currentCompleted });
      fetchProjects();
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-brand-600" />
          Projects & Tasks
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor delivery deadlines, task milestones, and operational workflows ({statuses.length} pipeline stages).
        </p>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleCreateTask} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new project or deliverable task..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </form>

      {/* Projects List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading tasks...</div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No project tasks found.</div>
        ) : (
          projects.map((proj) => (
            <div
              key={proj.id}
              className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleCompleted(proj.id, proj.is_completed)}
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                    proj.is_completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {proj.is_completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
                <div>
                  <p className={`text-xs font-bold ${proj.is_completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {proj.title}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    {proj.leads && <span>Client: {proj.leads.company_name || proj.leads.name}</span>}
                    {proj.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(proj.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                  {proj.project_statuses?.name || 'In Progress'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
