import React, { useEffect, useState, useMemo } from 'react';
import { getApi } from '../../services/api';
import { Search, Users, Loader2, ShieldCheck } from 'lucide-react';

const PLAN_STYLES = {
  free_trial: 'bg-gray-100 text-gray-700',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
};

const PLAN_LABELS = {
  free_trial: 'Free Trial',
  starter: 'Starter',
  pro: 'Pro',
  cancelled: 'Cancelled',
};

const PlanBadge = ({ plan }) => {
  const key = plan?.toLowerCase() || 'free_trial';
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        PLAN_STYLES[key] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {PLAN_LABELS[key] || plan || 'Free Trial'}
    </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const FILTER_TABS = ['All', 'Free Trial', 'Starter', 'Pro'];

const planMatchesFilter = (plan, filter) => {
  if (filter === 'All') return true;
  const normalized = plan?.toLowerCase() || 'free_trial';
  return normalized === filter.toLowerCase().replace(' ', '_');
};

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    getApi()
      .get('/admin/users?limit=50')
      .then((res) => setUsers(Array.isArray(res) ? res : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search || u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesPlan = planMatchesFilter(u.plan, activeFilter);
      return matchesSearch && matchesPlan;
    });
  }, [users, search, activeFilter]);

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {loading ? '…' : users.length}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">All registered accounts</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Plan tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            Error loading users: {error}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                      <Users size={32} className="mx-auto mb-2 text-gray-300" />
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {user.email || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <PlanBadge plan={user.plan} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.trial_minutes_used != null
                          ? `${user.trial_minutes_used} min`
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {user.is_admin ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-blue-600">
                            <ShieldCheck size={14} /> Admin
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filtered.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                Showing {filtered.length} of {users.length} users
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
