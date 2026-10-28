import React, { useEffect, useState } from 'react';
import { Headphones } from 'lucide-react';
import { api } from '../lib/api';

export const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get('/api/support/tickets');
        if (res.data.success) {
          setTickets(res.data.tickets || []);
        }
      } catch (err) {
        console.error('Error fetching tickets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Headphones className="w-6 h-6 text-brand-600" />
          Customer Support & Helpdesk
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor incoming support tickets, resolutions, and customer satisfaction.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Support Tickets Queue</h2>
          <span className="text-xs text-slate-400 font-semibold">{tickets.length} total tickets</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No support tickets found.</div>
        ) : (
          tickets.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
              <div>
                <p className="text-xs font-bold text-slate-900">{t.subject || t.title}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                  <span>Ticket #{t.id}</span>
                  {t.created_at && <span>{new Date(t.created_at).toLocaleDateString()}</span>}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {t.ticket_statuses?.name || 'Open'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
