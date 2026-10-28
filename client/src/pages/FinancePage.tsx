import React, { useEffect, useState } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import { api } from '../lib/api';

export const FinancePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchFinance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/finance/summary');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching finance summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const summary = data?.summary || {};
  const recentIncomes = data?.recentIncomes || [];
  const recentExpenses = data?.recentExpenses || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-brand-600" />
          Finance & Accounting
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor revenue, incoming client payments, operational expenses, and net profit.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Income</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              ₹{loading ? '-' : Number(summary.totalIncome || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Expenses</p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              ₹{Number(summary.totalExpense || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Balance</p>
            <p className="text-2xl font-black text-brand-600 mt-1">
              ₹{Number(summary.balance || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Incomes</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recentIncomes.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No income records.</p>
            ) : (
              recentIncomes.map((inc: any) => (
                <div key={inc.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{inc.title}</p>
                    <p className="text-[11px] text-slate-400">{new Date(inc.date).toLocaleDateString()}</p>
                  </div>
                  <span className="font-bold text-emerald-600">
                    +₹{Number(inc.amount).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expense Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Expenses</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recentExpenses.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No expense records.</p>
            ) : (
              recentExpenses.map((exp: any) => (
                <div key={exp.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{exp.title}</p>
                    <p className="text-[11px] text-slate-400">{new Date(exp.date).toLocaleDateString()}</p>
                  </div>
                  <span className="font-bold text-rose-600">
                    -₹{Number(exp.amount).toLocaleString()}
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
