import React, { useEffect, useState } from 'react';
import { Server, Check } from 'lucide-react';
import { api } from '../lib/api';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/api/services');
        if (res.data.success) {
          setServices(res.data.services || []);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Server className="w-6 h-6 text-brand-600" />
          Services Catalog
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Catalog of standard SaaS services, digital solutions, and client offerings.
        </p>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-200">
          Loading services...
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-200">
          No services defined yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm mb-3">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{srv.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                  {srv.description || 'Standard ERP enterprise service package.'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-brand-600">
                  {srv.price ? `₹${Number(srv.price).toLocaleString()}` : 'Custom Pricing'}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Available
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
