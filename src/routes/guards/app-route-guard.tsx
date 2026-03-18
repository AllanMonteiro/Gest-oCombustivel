import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";

interface AppRouteGuardProps {
  isAllowed?: boolean;
  redirectTo?: string;
}

export function AppRouteGuard({ isAllowed = true, redirectTo = "/login" }: AppRouteGuardProps) {
  const { status, isAuthenticated, isSupabaseConfigured } = useAuth();

  if (!isSupabaseConfigured) {
    return isAllowed ? <Outlet /> : <Navigate replace to={redirectTo} />;
  }

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Carregando sessao...</div>;
  }

  if (!isAuthenticated || !isAllowed) {
    return <Navigate replace to={redirectTo} />;
  }

  return <Outlet />;
}