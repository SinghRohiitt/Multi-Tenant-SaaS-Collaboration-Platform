import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Alert, Button, Input } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, register } from '@/features/auth/auth.slice';
import { selectAuthError, selectAuthLoading } from '@/features/auth/auth.selectors';
import { registerSchema, type RegisterFormValues } from '@/features/auth/auth.schemas';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const error = useAppSelector(selectAuthError);
  const loading = useAppSelector(selectAuthLoading);
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    dispatch(clearAuthError());
    const result = await dispatch(register(values));
    if (register.fulfilled.match(result)) navigate('/dashboard', { replace: true });
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">Get started</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Join an active organization and start collaborating.
        </p>
      </div>
      {error && (
        <Alert tone="danger" title="Registration failed">
          {error}
        </Alert>
      )}
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          autoComplete="organization"
          error={errors.tenantId?.message}
          label="Organization ID"
          {...registerField('tenantId')}
        />
        <Input
          autoComplete="name"
          error={errors.displayName?.message}
          label="Display name"
          {...registerField('displayName')}
        />
        <Input
          autoComplete="email"
          error={errors.email?.message}
          label="Email address"
          type="email"
          {...registerField('email')}
        />
        <Input
          autoComplete="new-password"
          error={errors.password?.message}
          label="Password"
          type="password"
          {...registerField('password')}
        />
        <Button className="w-full" loading={loading} type="submit">
          Create account
        </Button>
      </form>
      <p className="text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link className="font-medium text-cyan-300 hover:text-cyan-200" to="/login">
          Sign in
        </Link>
      </p>
    </section>
  );
}
