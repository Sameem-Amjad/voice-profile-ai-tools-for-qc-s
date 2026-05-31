import React, { useEffect, useState, useMemo } from 'react';
import { getApi } from '../../services/api';
import { Search, Users, Loader2, ShieldCheck, Clock, CheckCircle, Link, X } from 'lucide-react';

const PLAN_STYLES = {
  free_trial: 'bg-gray-100 text-gray-700',
  starter:    'bg-blue-100 text-blue-700',
  pro:        'bg-purple-100 text-purple-700',
  cancelled:  'bg-red-100 text-red-700',
};

const PLAN_LABELS = {
  free_trial: 'Free Trial',
  starter:    'Starter',
  pro:        'Pro',
  cancelled:  'Cancelled',
};

const PlanBadge = ({ plan }) => {
  const key = plan?.toLowerCase() || 'free_trial';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_STYLES[key] || 'bg-gray-100 text-gray-700'}`}>
      {PLAN_LABELS[key] || plan || 'Free Trial'}
    </span>
  );
};

const PendingBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
    <Clock size={10} /> Pending
  </span>
);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const FILTER_TABS = ['All', 'Pending', 'Free Trial', 'Starter', 'Pro'];

const planMatchesFilter = (plan, pending_plan, filter) => {
  if (filter === 'All') return true;
  if (filter === 'Pending') return !!pending_plan;
  const normalized = plan?.toLowerCase() || 'free_trial';
  return normalized === filter.toLowerCase().replace(' ', '_');
};

// ── Activate modal ────────────────────────────────────────────────────────────

const ActivateModal = ({ user, onClose, onDone }) => {
  const [plan, setPlan]       = useState(user.pending_plan || 'starter');
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState(null);

  const submit = async () => {
    setLoading(true);
    setErr(null);
    try {
      await getApi().post(`/admin/users/${user.id}/set-plan`, { plan });
      onDone(user.id, plan);
      onClose();
    } catch (e) {
      setErr(e.message || 'Failed to activate');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Activate Plan</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Setting plan for <strong className="text-gray-800">{user.email || user.id}</strong>
        </p>
        <select
          value={plan}
          onChange={e => setPlan(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="free_trial">Free Trial</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {err && <p className="text-red-600 text-xs mb-3">{err}</p>}
        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
            Activate
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Send payment link modal ───────────────────────────────────────────────────

const SendLinkModal = ({ user, onClose }) => {
  const [link, setLink]       = useState('');
  const [plan, setPlan]       = useState(user.pending_plan || 'starter');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [err, setErr]         = useState(null);

  const submit = async () => {
    if (!link.trim()) { setErr('Paste a payment link first.'); return; }
    setLoading(true);
    setErr(null);
    try {
      await getApi().post(`/admin/users/${user.id}/send-payment-link`, { payment_link: link.trim(), plan });
      setSent(true);
    } catch (e) {
      setErr(e.message || 'Failed to send');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Send Payment Link</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        {sent ? (
          <div className="text-center py-4">
            <CheckCircle className="text-green-500 mx-auto mb-2" size={32} />
            <p className="text-gray-700 font-medium">Link sent to {user.email}</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium">Close</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-1">To: <strong className="text-gray-800">{user.email || '—'}</strong></p>
            <select
              value={plan}
              onChange={e => setPlan(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="starter">Starter — PKR 5,571</option>
              <option value="pro">Pro — PKR 11,142</option>
            </select>
            <input
              type="url"
              placeholder="Paste Payoneer invoice link…"
              value={link}
              onChange={e => setLink(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {err && <p className="text-red-600 text-xs mb-3">{err}</p>}
            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <Link size={14} />}
                Send link
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const AdminUsers = () => {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activateFor, setActivateFor]   = useState(null);
  const [sendLinkFor, setSendLinkFor]   = useState(null);

  useEffect(() => {
    getApi()
      .get('/admin/users?limit=200')
      .then((res) => setUsers(Array.isArray(res) ? res : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleActivated = (userId, newPlan) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, plan: newPlan, pending_plan: null } : u
    ));
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = !search || u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesPlan   = planMatchesFilter(u.plan, u.pending_plan, activeFilter);
      return matchesSearch && matchesPlan;
    });
  }, [users, search, activeFilter]);

  const pendingCount = useMemo(() => users.filter(u => u.pending_plan).length, [users]);

  return (
    <div>
      {activateFor  && <ActivateModal  user={activateFor}  onClose={() => setActivateFor(null)}  onDone={handleActivated} />}
      {sendLinkFor  && <SendLinkModal  user={sendLinkFor}  onClose={() => setSendLinkFor(null)} />}

      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {loading ? '…' : users.length}
          </span>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
              <Clock size={11} /> {pendingCount} pending upgrade{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">Manage user plans and payment links</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
                {tab === 'Pending' && pendingCount > 0 && (
                  <span className="ml-1 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {pendingCount}
                  </span>
                )}
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
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
                    <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${user.pending_plan ? 'bg-yellow-50/40' : ''}`}>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        <div className="flex items-center gap-2">
                          {user.email || '—'}
                          {user.is_admin && <ShieldCheck size={13} className="text-blue-500 shrink-0" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <PlanBadge plan={user.plan} />
                          {user.pending_plan && (
                            <div className="flex items-center gap-1">
                              <PendingBadge />
                              <span className="text-xs text-yellow-700">→ {PLAN_LABELS[user.pending_plan] || user.pending_plan}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.trial_minutes_used != null ? `${user.trial_minutes_used} min` : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.pending_plan && (
                            <button
                              onClick={() => setSendLinkFor(user)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors"
                            >
                              <Link size={11} /> Send link
                            </button>
                          )}
                          <button
                            onClick={() => setActivateFor(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium transition-colors"
                          >
                            <CheckCircle size={11} /> Activate
                          </button>
                        </div>
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
