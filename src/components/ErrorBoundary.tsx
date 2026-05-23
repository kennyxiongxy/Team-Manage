import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          minHeight: '100vh',
          background: '#020617',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1 style={{ color: '#EF4444', fontSize: '24px', marginBottom: '16px' }}>
            页面渲染出错
          </h1>
          <pre style={{
            background: '#1E293B',
            padding: '16px',
            borderRadius: '8px',
            maxWidth: '800px',
            overflow: 'auto',
            fontSize: '14px',
            color: '#94A3B8',
            whiteSpace: 'pre-wrap',
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              background: '#06B6D4',
              color: '#020617',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            清除缓存并刷新
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
