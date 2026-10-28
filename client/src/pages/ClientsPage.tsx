import React, { useEffect, useState } from 'react';
import { Building2, Mail, Phone, ExternalLink, Search } from 'lucide-react';
import { api } from '../lib/api';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/clients', { params: { search } });
      if (res.data.success) {
        setClients(res.data.clients || []);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-brand-600" />
          Client Directory
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your accounts, active client organizations, and contracts.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchClients()}
            placeholder="Search clients by name, company, or email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-200">
          Loading client accounts...
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-200">
          No clients found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-sm text-brand-600">
                    {client.company_name?.charAt(0) || client.name.charAt(0)}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Client
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3">{client.company_name || client.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{client.name}</p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  {client.email && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>{client.tasks?.length || 0} active projects</span>
                <span className="text-brand-600 flex items-center gap-0.5 hover:underline cursor-pointer">
                  View Profile <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
