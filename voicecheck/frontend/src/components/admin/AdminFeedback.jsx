import React, { useEffect, useState } from 'react';
import { getApi } from '../../services/api';
import { Star, Check, X, ThumbsUp, Loader2 } from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const StarRating = ({ rating }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
};

const FeedbackCard = ({ item, onToggleApproval }) => {
  const [loading, setLoading] = useState(false);

  const handleToggle = async (approve) => {
    setLoading(true);
    // Optimistic update
    onToggleApproval(item.id, approve);
    try {
      await getApi().patch(`/admin/feedback/${item.id}`, { is_approved: approve });
    } catch {
      // Revert on error
      onToggleApproval(item.id, !approve);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <StarRating rating={item.rating} />
          {item.is_approved && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <Check size={11} /> Approved
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
      </div>

      {/* Feedback text */}
      {item.text && (
        <p className="text-sm text-gray-700 leading-relaxed">"{item.text}"</p>
      )}

      {/* Author */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{item.display_name || 'Anonymous'}</span>
        {item.role && (
          <>
            <span className="text-gray-300">·</span>
            <span>{item.role}</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {item.is_approved ? (
          <button
            onClick={() => handleToggle(false)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <X size={13} />
            Unapprove
          </button>
        ) : (
          <>
            <button
              onClick={() => handleToggle(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              <Check size={13} />
              Approve
            </button>
            <button
              onClick={() => handleToggle(false)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <X size={13} />
              Reject
            </button>
          </>
        )}
        {loading && <Loader2 size={14} className="animate-spin text-gray-400 self-center ml-1" />}
      </div>
    </div>
  );
};

const FILTER_TABS = ['All', 'Pending', 'Approved'];

export const AdminFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    getApi()
      .get('/admin/feedback?limit=50')
      .then((res) => setFeedback(Array.isArray(res) ? res : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleApproval = (id, isApproved) => {
    setFeedback((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_approved: isApproved } : item))
    );
  };

  const approvedCount = feedback.filter((f) => f.is_approved).length;
  const pendingCount = feedback.filter((f) => !f.is_approved).length;

  const filtered = feedback.filter((f) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Approved') return f.is_approved;
    if (activeFilter === 'Pending') return !f.is_approved;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            {loading ? '…' : `${pendingCount} pending`}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            {loading ? '…' : `${approvedCount} approved`}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">User testimonials and ratings</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeFilter === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            Error loading feedback: {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ThumbsUp size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">No feedback found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                onToggleApproval={handleToggleApproval}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
