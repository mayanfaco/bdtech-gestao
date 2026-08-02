import React from 'react';
import { Alert } from '../design-system/components/feedback/Alert.jsx';

export class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 'var(--bd-space-8)', maxWidth: 720 }}>
          <Alert tone="danger" title="Algo deu errado nesta tela">
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(this.state.error?.stack || this.state.error)}</pre>
          </Alert>
        </div>
      );
    }
    return this.props.children;
  }
}
