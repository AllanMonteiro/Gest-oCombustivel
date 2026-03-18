import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth/AuthContext";
import { AuthLayout } from "@/layouts/auth/auth-layout";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, isAuthenticated, isSupabaseConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured) {
    return <Navigate replace to="/" />;
  }

  if (isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate("/");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha ao entrar no sistema.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mx-auto max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Acesso ao sistema</p>
        <h2 className="mt-4 text-3xl font-semibold text-foreground">Entrar na plataforma</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Use sua conta do Supabase Auth para acessar o painel administrativo e sincronizar o sistema com a API operacional.
        </p>

        <form className="mt-10 space-y-4 rounded-[1.5rem] border border-border bg-background p-6" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Email</label>
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@empresa.com" type="email" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Senha</label>
            <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" type="password" />
          </div>
          {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          <Button className="w-full" disabled={loading} type="submit">{loading ? "Entrando..." : "Entrar"}</Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Se o Supabase ainda nao estiver configurado, o sistema continua acessivel em modo local pelo <Link className="font-medium text-accent" to="/">dashboard</Link>.
        </p>
      </div>
    </AuthLayout>
  );
}