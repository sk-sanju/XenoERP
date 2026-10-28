import React, { useEffect, useState } from 'react';
import { UserCheck } from 'lucide-react';
import { api } from '../lib/api';

export const HRPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHR = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/hr/employees');
      if (res.data.success) {
        setEmployees(res.data.employees || []);
        setLeaves(res.data.recentLeaves || []);
      }
    } catch (err) {
      console.error('Error fetching HR data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHR();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-brand-600" />
          Human Resources & Staff
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Team profiles, role permissions, departments, and attendance tracking.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Team Directory</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading team...</div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No staff profiles found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-600 flex items-center justify-center">
                          {emp.auth_user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{emp.auth_user?.username}</p>
                          <p className="text-[11px] text-slate-400">{emp.auth_user?.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {emp.role || 'Staff'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {emp.departments?.name || 'General Operations'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.auth_user?.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {emp.auth_user?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {leaves.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Active leave requests in pipeline:</span>
          <span className="font-bold text-slate-900">{leaves.length} pending</span>
        </div>
      )}
    </div>
  );
};
