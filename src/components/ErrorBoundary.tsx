import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Zapixal Uncaught UI Error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#121315] p-6 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-[#1c1d21] border border-zinc-200 dark:border-[#2d3036] rounded-3xl p-8 shadow-xl text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Something went wrong
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Zapixal encountered an unexpected display error. Your image files remain completely safe on your device.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-zinc-100 dark:bg-[#141517] rounded-xl text-left text-xs font-mono text-zinc-600 dark:text-zinc-400 max-h-24 overflow-y-auto break-all">
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-5 rounded-2xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
