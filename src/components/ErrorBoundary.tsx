import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`ErrorBoundary[${this.props.label ?? 'root'}]`, error, info);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  private handleReload = (): void => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        className="mx-auto max-w-md rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100"
      >
        <div className="mb-2 text-base font-semibold">Etwas ist schiefgelaufen.</div>
        <p className="mb-3">
          Du kannst es erneut versuchen oder die App neu laden. Deine gespeicherten Daten bleiben
          erhalten.
        </p>
        {import.meta.env.DEV && (
          <pre className="mb-3 max-h-40 overflow-auto rounded bg-red-100 p-2 font-mono text-xs dark:bg-red-900/30">
            {error.message}
          </pre>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={this.handleReset}
            className="min-h-11 rounded-lg border border-red-400 bg-white px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-100 dark:bg-red-950 dark:text-red-100 dark:hover:bg-red-900/50"
          >
            Erneut versuchen
          </button>
          <button
            type="button"
            onClick={this.handleReload}
            className="min-h-11 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Neu laden
          </button>
        </div>
      </div>
    );
  }
}
