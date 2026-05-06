import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { getApi } from '../../services/api';
import { DollarSign, TrendingUp, Users, Loader2 } from 'lucide-react';

const STARTER_PRICE = 20;
const PRO_PRICE = 40;

const StatCard = ({ label, value, sub, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <div className={`p-2 rounded-full ${colorClass}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.fill }}>
            {p.name}: {p.dataKey === 'revenue' ? `$${p.value}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AdminRevenue = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getApi()
      .get('/admin/revenue')
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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          Error loading revenue: {error}
        </div>
      </div>
    );
  }

  const starterCount = data.starter_count || 0;
  const proCount = data.pro_count || 0;
  const estimatedMrr = data.estimated_mrr ?? starterCount * STARTER_PRICE + proCount * PRO_PRICE;
  const totalActive = data.total_active_subscriptions || starterCount + proCount;

  const barData = [
    {
      plan: 'Starter',
      subscribers: starterCount,
      revenue: starterCount * STARTER_PRICE,
    },
    {
      plan: 'Pro',
      subscribers: proCount,
      revenue: proCount * PRO_PRICE,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
        <p className="text-sm text-gray-500 mt-1">Subscription metrics and estimated earnings</p>
      </div>

      <div className="p-8 space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            label="Estimated MRR"
            value={`$${Math.round(estimatedMrr).toLocaleString()}/mo`}
            icon={DollarSign}
            colorClass="bg-green-500"
          />
          <StatCard
            label="Active Subscriptions"
            value={totalActive}
            sub="Paid plans only"
            icon={TrendingUp}
            colorClass="bg-blue-500"
          />
          <StatCard
            label="Plan Split"
            value={`${starterCount} / ${proCount}`}
            sub="Starter / Pro"
            icon={Users}
            colorClass="bg-purple-500"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscriber count */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Subscribers by Plan</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="plan" tick={{ fontSize: 13 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="subscribers" name="Subscribers" radius={[4, 4, 0, 0]}>
                  <Cell fill="#3b82f6" />
                  <Cell fill="#a855f7" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue per plan */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Estimated Revenue by Plan</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="plan" tick={{ fontSize: 13 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                  <Cell fill="#22c55e" />
                  <Cell fill="#10b981" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Plan Breakdown</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Price / mo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Subscribers
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Est. MRR
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    Starter
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">${STARTER_PRICE}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{starterCount}</td>
                <td className="px-6 py-4 text-sm font-semibold text-green-600">
                  ${(starterCount * STARTER_PRICE).toLocaleString()}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    Pro
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">${PRO_PRICE}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{proCount}</td>
                <td className="px-6 py-4 text-sm font-semibold text-green-600">
                  ${(proCount * PRO_PRICE).toLocaleString()}
                </td>
              </tr>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-6 py-4 text-sm text-gray-900">Total</td>
                <td className="px-6 py-4" />
                <td className="px-6 py-4 text-sm text-gray-900">{totalActive}</td>
                <td className="px-6 py-4 text-sm text-green-700">
                  ${Math.round(estimatedMrr).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400">
          Revenue is estimated based on active plan subscriptions at list prices.
          Actual billing may vary due to trials, discounts, or refunds.
        </p>
      </div>
    </div>
  );
};
