import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-5">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-bold text-white">Something went wrong</h1>
          <p className="text-gray-400 text-sm">
            An unexpected error occurred. Refreshing the page usually fixes it.
          </p>
          {this.state.error?.message && (
            <pre className="text-xs text-red-300 bg-black/30 rounded-lg p-3 text-left overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
