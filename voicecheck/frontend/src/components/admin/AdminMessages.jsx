import React, { useEffect, useState } from 'react';
import { getApi } from '../../services/api';
import { MessageSquare, Send, CheckCircle, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StatusBadge = ({ status }) => {
  if (status === 'replied') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle size={11} /> Replied
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      <Clock size={11} /> Pending
    </span>
  );
};

const MessageCard = ({ message, onReplySent }) => {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const isLong = message.message && message.message.length > 200;
  const displayText =
    expanded || !isLong ? message.message : message.message.slice(0, 200) + '…';

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      await getApi().post(`/admin/messages/${message.id}/reply`, {
        reply_text: replyText.trim(),
      });
      onReplySent(message.id, replyText.trim());
      setReplyText('');
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{message.name || 'Anonymous'}</p>
          <p className="text-sm text-gray-500">{message.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={message.status} />
          <span className="text-xs text-gray-400">{formatDate(message.created_at)}</span>
        </div>
      </div>

      {/* Subject */}
      {message.subject && (
        <p className="font-medium text-gray-800 text-sm">{message.subject}</p>
      )}

      {/* Message body */}
      <div className="text-sm text-gray-600 leading-relaxed">
        <p>{displayText}</p>
        {isLong && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {expanded ? (
              <>
                <ChevronUp size={13} /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={13} /> Show more
              </>
            )}
          </button>
        )}
      </div>

      {/* Reply area */}
      {message.status === 'pending' ? (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply…"
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {sendError && (
            <p className="text-xs text-red-600">{sendError}</p>
          )}
          <button
            onClick={handleReply}
            disabled={sending || !replyText.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {sending ? 'Sending…' : 'Send Reply'}
          </button>
        </div>
      ) : message.admin_reply ? (
        <div className="border-t border-gray-100 pt-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1">Admin Reply</p>
            <p className="text-sm text-blue-900">{message.admin_reply}</p>
            {message.replied_at && (
              <p className="text-xs text-blue-400 mt-1">{formatDate(message.replied_at)}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const FILTER_TABS = ['All', 'Pending', 'Replied'];

export const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    getApi()
      .get('/admin/messages?limit=50')
      .then((res) => setMessages(Array.isArray(res) ? res : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleReplySent = (id, replyText) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: 'replied', admin_reply: replyText, replied_at: new Date().toISOString() }
          : m
      )
    );
  };

  const filtered = messages.filter((m) => {
    if (activeFilter === 'All') return true;
    return m.status === activeFilter.toLowerCase();
  });

  const pendingCount = messages.filter((m) => m.status === 'pending').length;

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {loading ? '…' : messages.length}
          </span>
          {pendingCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">Contact form submissions</p>
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
            Error loading messages: {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <MessageSquare size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">No messages found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                onReplySent={handleReplySent}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
