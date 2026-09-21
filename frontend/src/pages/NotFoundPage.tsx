import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center text-slate-100">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">404</p>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <Link className="inline-block text-cyan-300 underline-offset-4 hover:underline" to="/">
          Return home
        </Link>
      </div>
    </main>
  );
}
