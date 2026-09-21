import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center text-slate-100">
      <div className="max-w-md space-y-4">
        <p className="text-sm font-medium uppercase tracking-widest text-amber-300">403</p>
        <h1 className="text-3xl font-semibold">Access not available</h1>
        <p className="text-sm leading-6 text-slate-400">
          Your account does not have the role required to view this area.
        </p>
        <Link
          className="inline-flex min-h-10 items-center rounded-lg bg-cyan-400 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          to="/dashboard"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
