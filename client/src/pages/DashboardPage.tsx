import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/dashboard/stats');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = data?.stats || {};
  const recentLeads = data?.recentLeads || [];
  const recentTasks = data?.recentTasks || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.firstName || user?.username}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Here's what's happening with your ERP workspace today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/leads"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Lead
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Leads</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {loading ? '-' : stats.totalLeads ?? 0}
            </p>
            <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{stats.convertedClients ?? 0} converted clients</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Converted Clients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Clients</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {loading ? '-' : stats.convertedClients ?? 0}
            </p>
            <p className="text-[11px] font-semibold text-slate-400 mt-2">Active accounts</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Total Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Projects & Tasks</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {loading ? '-' : stats.totalTasks ?? 0}
            </p>
            <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats.completedTasks ?? 0} completed</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Net Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Revenue</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ₹{loading ? '-' : Number(stats.netProfit || 0).toLocaleString()}
            </p>
            <p className="text-[11px] font-semibold text-slate-400 mt-2">
              Income: ₹{Number(stats.totalRevenue || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Two-Column Activity & Tasks Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Leads</h2>
            </div>
            <Link to="/leads" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentLeads.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No leads found.</p>
            ) : (
              recentLeads.map((lead: any) => (
                <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{lead.name}</p>
                    <p className="text-[11px] text-slate-400">{lead.company_name || lead.email || 'No company'}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {lead.lead_statuses?.name || 'New'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-900">Active Tasks</h2>
            </div>
            <Link to="/projects" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTasks.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No tasks found.</p>
            ) : (
              recentTasks.map((task: any) => (
                <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{task.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : 'No deadline'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                    {task.project_statuses?.name || 'In Progress'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
