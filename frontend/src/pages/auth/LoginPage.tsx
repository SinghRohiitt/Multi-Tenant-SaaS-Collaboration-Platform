import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Alert, Button, Input } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, login } from '@/features/auth/auth.slice';
import { selectAuthError, selectAuthLoading } from '@/features/auth/auth.selectors';
import { loginSchema, type LoginFormValues } from '@/features/auth/auth.schemas';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const error = useAppSelector(selectAuthError);
  const loading = useAppSelector(selectAuthLoading);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    dispatch(clearAuthError());
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) navigate('/dashboard', { replace: true });
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Sign in to your workspace
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Use your organization and account details to continue.
        </p>
      </div>
      {error && (
        <Alert tone="danger" title="Sign-in failed">
          {error}
        </Alert>
      )}
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          autoComplete="organization"
          error={errors.tenantId?.message}
          label="Organization ID"
          {...register('tenantId')}
        />
        <Input
          autoComplete="email"
          error={errors.email?.message}
          label="Email address"
          type="email"
          {...register('email')}
        />
        <Input
          autoComplete="current-password"
          error={errors.password?.message}
          label="Password"
          type="password"
          {...register('password')}
        />
        <Button className="w-full" loading={loading} type="submit">
          Sign in
        </Button>
      </form>
      <p className="text-center text-sm text-slate-400">
        Need an account?{' '}
        <Link className="font-medium text-cyan-300 hover:text-cyan-200" to="/register">
          Create one
        </Link>
      </p>
    </section>
  );
}
