"use client";

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
}

const INITIAL_STATE: ErrorBoundaryState = {
  hasError: false,
  error: null,
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = INITIAL_STATE;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState(INITIAL_STATE);
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FF483A]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#FF483A]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div>
            <h2
              className="text-lg font-semibold tracking-wide uppercase"
              style={{ color: "#414344", fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}
            >
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              An unexpected error occurred. Please try again.
            </p>
          </div>

          {this.state.error && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 break-all font-mono">
              {this.state.error.message}
            </p>
          )}

          <button
            onClick={this.handleRetry}
            className="px-8 py-3 rounded-full text-white text-sm font-semibold tracking-wide uppercase transition-all hover:opacity-90"
            style={{ backgroundColor: "#FF483A" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
}
