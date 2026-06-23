import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access the internal PDF processing tools."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-teal-700 hover:text-teal-800">
            Register
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
