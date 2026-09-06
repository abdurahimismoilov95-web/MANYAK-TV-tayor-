import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          id="admin-error-boundary-modal"
          className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg bg-zinc-900 border border-red-500/40 rounded-2xl p-6 shadow-2xl shadow-red-950/60 text-zinc-100">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-400">
                <ShieldAlert className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {this.props.title || 'Admin panelida kutilmagan xatolik yuz berdi'}
                </h3>
                <p className="text-xs text-zinc-400">
                  Asosiy ilova xavfsiz holatda qoldi va ishlashda davom etmoqda.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="my-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-red-300/90 overflow-x-auto max-h-32">
                {this.state.error.name}: {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 mt-5">
              {this.props.onReset && (
                <button
                  type="button"
                  id="btn-error-boundary-close"
                  onClick={this.handleReset}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Yopish</span>
                </button>
              )}
              <button
                type="button"
                id="btn-error-boundary-retry"
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-red-600/30"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Qayta urinish</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
