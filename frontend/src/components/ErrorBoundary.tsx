import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Displays a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    // Clear error state and reload the page
    window.location.reload();
  };

  handleReset = () => {
    // Clear error state without reloading
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 dark:from-red-900/20 dark:via-orange-900/20 dark:to-red-900/20 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl p-8 animate-fadeIn">
            {/* Error Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <span className="text-3xl font-bold text-red-600 dark:text-red-400">!</span>
              </div>
              <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                Bir Şeyler Yanlış Gitti
              </h1>
              <p className="text-neutral-600 dark:text-neutral-300">
                Uygulama beklenmeyen bir hata ile karşılaştı
              </p>
            </div>

            {/* Error Details (Development Mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center">
                  <span className="mr-2">🐛</span>
                  Hata Detayları (Sadece Geliştirme Modunda)
                </h3>
                <pre className="text-xs text-red-700 dark:text-red-400 overflow-x-auto whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <span>🔄</span>
                <span>Sayfayı Yenile</span>
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 px-6 py-3 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <span>Tekrar Dene</span>
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
              <p>Sorun devam ederse, lütfen sistem yöneticisi ile iletişime geçin.</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

