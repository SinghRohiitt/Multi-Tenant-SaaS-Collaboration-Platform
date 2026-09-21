import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center text-sm font-semibold tracking-wide text-slate-300">
          Collaboration Platform
        </p>
        <Outlet />
      </div>
    </main>
  );
}
