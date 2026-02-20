import React, { Component, ErrorInfo, ReactNode } from "react";
import { analytics } from "@/services/analytics";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Track error in analytics
    analytics.trackError(error.message, error.stack, {
      componentStack: errorInfo.componentStack,
      errorName: error.name,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">
              Ops! Algo deu errado
            </h2>

            <p className="text-center text-gray-600 mb-6">
              Encontramos um erro inesperado. Nossa equipe foi notificada e estamos trabalhando para
              resolver.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                <summary className="cursor-pointer font-medium text-sm text-gray-700 mb-2">
                  Detalhes do erro (apenas em desenvolvimento)
                </summary>
                <div className="text-xs text-gray-600 space-y-2">
                  <div>
                    <strong>Erro:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 overflow-auto text-xs bg-white p-2 rounded border">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 overflow-auto text-xs bg-white p-2 rounded border">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                Ir para Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
