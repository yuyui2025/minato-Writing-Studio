import { Component, ReactNode, ErrorInfo } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0a0e1a",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            color: "#c8d8e8",
            fontFamily: "'Noto Serif JP','Georgia',serif",
          }}
        >
          <div style={{ fontSize: 13, color: "#e05555", letterSpacing: 1 }}>
            ⚠ 予期しないエラーが発生しました
          </div>
          {this.state.error && (
            <div
              style={{
                fontSize: 11,
                color: "#3a5570",
                maxWidth: 400,
                textAlign: "center",
                wordBreak: "break-all",
              }}
            >
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{
              padding: "8px 24px",
              background: "rgba(74,111,165,0.1)",
              border: "1px solid #2a4060",
              color: "#4a6fa5",
              cursor: "pointer",
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "inherit",
              letterSpacing: 1,
            }}
          >
            再試行
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
