"use client";

import React, { Component, ErrorInfo } from "react";
import { ErrorBoundaryProps, ErrorBoundaryState } from "@/lib/types";

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <main className="shop-shell system-state">
            <p className="eyebrow">A brief interruption</p>
            <h1>Something went wrong</h1>
            <p className="muted">Refresh the page or contact the studio.</p>
            <div className="shop-actions">
              <button
                className="shop-primary"
                onClick={() => window.location.reload()}
              >
                Refresh page
              </button>
              <button className="shop-secondary" onClick={this.reset}>
                Try again
              </button>
            </div>
          </main>
        )
      );
    }

    return this.props.children;
  }
}
