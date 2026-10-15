import LoginForm from './LoginForm.jsx';

export const metadata = { title: 'Admin | Mimo Pet Spa' };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-space-md">
      <LoginForm />
    </main>
  );
}
