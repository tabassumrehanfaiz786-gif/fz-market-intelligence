import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

export const Route = createFileRoute('/auth')({
  head: () => ({ meta: [
    { title: 'Sign in — Fz Market Intelligence' },
    { name: 'description', content: 'Sign in to your Fz Market Intelligence research workspace.' },
    { property: 'og:title', content: 'Sign in — Fz Market Intelligence' },
    { property: 'og:description', content: 'Access private cases and account settings.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = mode === 'in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (mode === 'up') return toast.success('Check your email to confirm your account.');
    navigate({ to: '/dashboard' });
  };
  const google = async () => {
    const r = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    if (r.error) toast.error(String(r.error.message ?? r.error));
  };
  return (
    <main className="min-h-screen grid place-items-center bg-background p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 border border-border rounded p-6 bg-card">
        <div className="brand-mark">Fz</div>
        <h1 className="text-lg font-medium">{mode === 'in' ? 'Sign in' : 'Create account'}</h1>
        <input className="fz-input" type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="fz-input" type="password" required minLength={6} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <Button className="w-full" disabled={busy}>{mode === 'in' ? 'Sign in' : 'Sign up'}</Button>
        <Button type="button" variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
        <Button type="button" variant="link" className="w-full" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        </Button>
      </form>
    </main>
  );
}
