import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Users,
  CreditCard,
  Package,
  Zap,
  BarChart2,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { getApi } from '../../services/api';

const COLORS = {
  free: '#9ca3af',
  starter: '#3b82f6',
  pro: '#a855f7',
};

const StatCard = ({ label, value, icon: Icon, colorClass, highlight }) => (
  <div
    className={`bg-white rounded-xl p-6 shadow-sm border ${
      highlight ? 'border-red-200 bg-red-50' : 'border-transparent'
    }`}
  >
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <div className={`p-2 rounded-full ${colorClass}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className={`text-3xl font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
      {value ?? '—'}
    </p>
  </div>
);

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getApi()
      .get('/admin/overview')
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          Error loading overview: {error}
        </div>
      </div>
    );
  }

  const freeCount =
    (data.total_users || 0) -
    (data.starter_count || 0) -
    (data.pro_count || 0) -
    (data.free_trial_count || 0);

  const pieData = [
    { name: 'Free', value: Math.max(0, freeCount), color: COLORS.free },
    { name: 'Free Trial', value: data.free_trial_count || 0, color: '#f59e0b' },
    { name: 'Starter', value: data.starter_count || 0, color: COLORS.starter },
    { name: 'Pro', value: data.pro_count || 0, color: COLORS.pro },
  ].filter((d) => d.value > 0);

  const totalPlans =
    (data.starter_count || 0) + (data.pro_count || 0) + (data.free_trial_count || 0);
  const starterPct = totalPlans > 0 ? ((data.starter_count || 0) / data.total_users) * 100 : 0;
  const proPct = totalPlans > 0 ? ((data.pro_count || 0) / data.total_users) * 100 : 0;
  const trialPct =
    totalPlans > 0 ? ((data.free_trial_count || 0) / data.total_users) * 100 : 0;
  const freePct = 100 - starterPct - proPct - trialPct;

  const statCards = [
    {
      label: 'Total Users',
      value: data.total_users,
      icon: Users,
      colorClass: 'bg-blue-500',
    },
    {
      label: 'Active Subscriptions',
      value: data.active_subscriptions,
      icon: CreditCard,
      colorClass: 'bg-green-500',
    },
    {
      label: 'Starter Plans',
      value: data.starter_count,
      icon: Package,
      colorClass: 'bg-purple-500',
    },
    {
      label: 'Pro Plans',
      value: data.pro_count,
      icon: Zap,
      colorClass: 'bg-amber-500',
    },
    {
      label: 'Total Analyses',
      value: data.total_analyses,
      icon: BarChart2,
      colorClass: 'bg-indigo-500',
    },
    {
      label: 'Pending Messages',
      value: data.pending_messages,
      icon: MessageSquare,
      colorClass: data.pending_messages > 0 ? 'bg-red-500' : 'bg-gray-400',
      highlight: data.pending_messages > 0,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Platform health at a glance</p>
      </div>

      <div className="p-8 space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        {/* Plan Distribution Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Plan Distribution</h2>
          <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
            {freePct > 0 && (
              <div
                style={{ width: `${freePct}%`, backgroundColor: COLORS.free }}
                title={`Free: ${Math.round(freePct)}%`}
                className="transition-all"
              />
            )}
            {trialPct > 0 && (
              <div
                style={{ width: `${trialPct}%`, backgroundColor: '#f59e0b' }}
                title={`Free Trial: ${Math.round(trialPct)}%`}
                className="transition-all"
              />
            )}
            {starterPct > 0 && (
              <div
                style={{ width: `${starterPct}%`, backgroundColor: COLORS.starter }}
                title={`Starter: ${Math.round(starterPct)}%`}
                className="transition-all"
              />
            )}
            {proPct > 0 && (
              <div
                style={{ width: `${proPct}%`, backgroundColor: COLORS.pro }}
                title={`Pro: ${Math.round(proPct)}%`}
                className="transition-all"
              />
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS.free }} />
              Free ({Math.round(freePct)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#f59e0b' }} />
              Free Trial ({data.free_trial_count || 0})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS.starter }} />
              Starter ({data.starter_count || 0})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS.pro }} />
              Pro ({data.pro_count || 0})
            </span>
          </div>
        </div>

        {/* Bottom row: Donut + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Plan Breakdown</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                No user data yet
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-center gap-3 py-2 border-b border-gray-100">
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  <strong>{data.total_users || 0}</strong> total registered users
                </span>
              </li>
              <li className="flex items-center gap-3 py-2 border-b border-gray-100">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span>
                  <strong>{data.active_subscriptions || 0}</strong> active subscriptions
                </span>
              </li>
              <li className="flex items-center gap-3 py-2 border-b border-gray-100">
                <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                <span>
                  <strong>{data.total_analyses || 0}</strong> analyses completed
                </span>
              </li>
              <li className="flex items-center gap-3 py-2 border-b border-gray-100">
                <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                <span>
                  <strong>{data.total_messages || 0}</strong> total contact messages
                </span>
              </li>
              <li className="flex items-center gap-3 py-2">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    data.pending_messages > 0 ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                />
                <span>
                  <strong
                    className={data.pending_messages > 0 ? 'text-red-600' : ''}
                  >
                    {data.pending_messages || 0}
                  </strong>{' '}
                  messages pending reply
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
