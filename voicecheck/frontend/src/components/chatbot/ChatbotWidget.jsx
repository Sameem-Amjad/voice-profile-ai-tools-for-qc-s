import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import clsx from 'clsx';
import { sendChatMessage } from '../../services/api';

const BotAvatar = () => (
  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
    <Bot size={14} className="text-white" />
  </div>
);

const TypingIndicator = () => (
  <div className="flex items-end gap-2">
    <BotAvatar />
    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </div>
);

export const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm SoundProof's assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const data = await sendChatMessage(text);
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply || 'Sorry, I didn\'t understand that.' }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      {open && (
        <div className="w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-blue-600">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">SoundProof Assistant</p>
                <p className="text-blue-200 text-xs">Online</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={clsx(
                  'flex items-end gap-2',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {msg.role === 'bot' && <BotAvatar />}
                <div
                  className={clsx(
                    'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message…"
              disabled={loading}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-400 disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className={clsx(
                'p-2.5 rounded-xl transition-colors shrink-0',
                input.trim() && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          'w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-100',
          open ? 'bg-gray-700 hover:bg-gray-800' : 'bg-blue-600 hover:bg-blue-700'
        )}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-white" />
        )}
      </button>
    </div>
  );
};
