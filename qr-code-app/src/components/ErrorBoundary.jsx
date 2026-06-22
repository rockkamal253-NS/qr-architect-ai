import { Component } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#07081a] text-slate-100 p-6">
          <div className="max-w-md w-full text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-slate-400 mb-6">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition"
            >
              <RotateCcw size={16} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
