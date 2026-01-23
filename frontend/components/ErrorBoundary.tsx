"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, WifiOff, Database, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

type ErrorType = "network" | "database" | "auth" | "unknown";

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: ErrorType;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: "unknown",
      retryCount: 0,
    };
  }

  static detectErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("cors")
    ) {
      return "network";
    }

    if (
      message.includes("database") ||
      message.includes("prisma") ||
      message.includes("connection")
    ) {
      return "database";
    }

    if (
      message.includes("unauthorized") ||
      message.includes("401") ||
      message.includes("token") ||
      message.includes("auth")
    ) {
      return "auth";
    }

    return "unknown";
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorType: ErrorBoundary.detectErrorType(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: "unknown",
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  handleLogin = () => {
    window.location.href = "/login";
  };

  getErrorConfig = () => {
    const { errorType } = this.state;

    switch (errorType) {
      case "network":
        return {
          icon: <WifiOff className="h-8 w-8 text-amber-600" />,
          iconBg: "bg-amber-100",
          title: "Connection Problem",
          description:
            "We're having trouble connecting to the server. This could be due to your internet connection or the server may be temporarily unavailable.",
          showRetry: true,
          showRefresh: true,
        };
      case "database":
        return {
          icon: <Database className="h-8 w-8 text-blue-600" />,
          iconBg: "bg-blue-100",
          title: "Database Error",
          description:
            "There was a problem accessing the database. This is usually temporary - please try again in a moment.",
          showRetry: true,
          showRefresh: true,
        };
      case "auth":
        return {
          icon: <AlertTriangle className="h-8 w-8 text-orange-600" />,
          iconBg: "bg-orange-100",
          title: "Session Expired",
          description:
            "Your session has expired or you don't have permission to access this resource. Please log in again.",
          showRetry: false,
          showRefresh: false,
          showLogin: true,
        };
      default:
        return {
          icon: <AlertTriangle className="h-8 w-8 text-red-600" />,
          iconBg: "bg-red-100",
          title: "Something went wrong",
          description:
            "We're sorry, but something unexpected happened. Please try refreshing the page.",
          showRetry: true,
          showRefresh: true,
        };
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const config = this.getErrorConfig();

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-gray-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className={`p-3 ${config.iconBg} rounded-full`}>
                  {config.icon}
                </div>
              </div>
              <CardTitle className="text-xl text-gray-900">
                {config.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">{config.description}</p>

              {this.state.retryCount > 0 && (
                <p className="text-sm text-gray-500">
                  Retry attempts: {this.state.retryCount}
                </p>
              )}

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="text-left bg-gray-50 p-3 rounded-lg">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div>
                      <strong>Type:</strong> {this.state.errorType}
                    </div>
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-2 justify-center flex-wrap">
                {config.showRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
                {config.showRefresh && (
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Refresh Page
                  </Button>
                )}
                {(config as any).showLogin && (
                  <Button
                    onClick={this.handleLogin}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Go to Login
                  </Button>
                )}
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  return function ErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Utility for handling async errors
export function withAsyncErrorHandling<
  T extends (...args: any[]) => Promise<any>
>(fn: T, onError?: (error: Error) => void): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else {
        console.error("Async error:", error);
      }
      throw error;
    }
  }) as T;
}
