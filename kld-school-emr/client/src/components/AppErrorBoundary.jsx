import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('KLD School EMR render error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="mesh-bg flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <section className="surface w-full max-w-xl p-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
            <AlertTriangle size={28}/>
          </div>
          <h1 className="mt-5 text-2xl font-extrabold">This page could not be displayed</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Your data was not changed. Reload the page, or return to the dashboard. If the problem repeats, give the clinic administrator the request time and page address.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 max-h-36 overflow-auto rounded-xl bg-slate-950 p-3 text-left text-xs text-slate-200">
              {String(this.state.error?.message || this.state.error)}
            </pre>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="btn-primary" onClick={() => window.location.reload()}><RefreshCw size={17}/>Reload page</button>
            <a className="btn-secondary" href="/dashboard"><Home size={17}/>Dashboard</a>
          </div>
        </section>
      </main>
    );
  }
}
