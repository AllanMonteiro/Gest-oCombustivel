import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/admin/admin-layout";
import { LoginPage } from "@/pages/auth/login-page";
import { AreasPage } from "@/pages/cadastros/areas/areas-page";
import { CombustiveisPage } from "@/pages/cadastros/combustiveis/combustiveis-page";
import { EquipamentosPage } from "@/pages/cadastros/equipamentos/equipamentos-page";
import { UsuariosPage } from "@/pages/cadastros/usuarios/usuarios-page";
import { EmailSummarySettingsPage } from "@/pages/configuracoes/email/email-summary-settings-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { EmprestimosPage } from "@/pages/emprestimos/emprestimos-page";
import { NotFoundPage } from "@/pages/errors/not-found-page";
import { UnauthorizedPage } from "@/pages/errors/unauthorized-page";
import { EntradasPage } from "@/pages/entradas/entradas-page";
import { RelatoriosPage } from "@/pages/relatorios/relatorios-page";
import { SaidasPage } from "@/pages/saidas/saidas-page";
import { AppRouteGuard } from "./guards/app-route-guard";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/nao-autorizado",
    element: <UnauthorizedPage />,
  },
  {
    element: <AppRouteGuard />,
    children: [
      {
        path: "/",
        element: (
          <AdminLayout>
            <DashboardPage />
          </AdminLayout>
        ),
      },
      {
        path: "/entradas",
        element: (
          <AdminLayout>
            <EntradasPage />
          </AdminLayout>
        ),
      },
      {
        path: "/saidas",
        element: (
          <AdminLayout>
            <SaidasPage />
          </AdminLayout>
        ),
      },
      {
        path: "/emprestimos",
        element: (
          <AdminLayout>
            <EmprestimosPage />
          </AdminLayout>
        ),
      },
      {
        path: "/relatorios",
        element: (
          <AdminLayout>
            <RelatoriosPage />
          </AdminLayout>
        ),
      },
      {
        path: "/configuracoes",
        element: (
          <AdminLayout>
            <EmailSummarySettingsPage />
          </AdminLayout>
        ),
      },
      {
        path: "/configuracoes/email",
        element: <Navigate to="/configuracoes" replace />,
      },
      {
        path: "/cadastros/combustiveis",
        element: (
          <AdminLayout>
            <CombustiveisPage />
          </AdminLayout>
        ),
      },
      {
        path: "/cadastros/areas",
        element: (
          <AdminLayout>
            <AreasPage />
          </AdminLayout>
        ),
      },
      {
        path: "/cadastros/equipamentos",
        element: (
          <AdminLayout>
            <EquipamentosPage />
          </AdminLayout>
        ),
      },
      {
        path: "/cadastros/usuarios",
        element: (
          <AdminLayout>
            <UsuariosPage />
          </AdminLayout>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
