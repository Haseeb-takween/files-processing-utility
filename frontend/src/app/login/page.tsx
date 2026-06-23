import Link from 'next/link';
import { Suspense } from 'react';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to process your files."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-teal-700 hover:text-teal-800">
            Register
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-slate-600">Loading...</p>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
