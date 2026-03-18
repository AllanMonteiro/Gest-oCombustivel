import {
  BarChart3,
  ClipboardList,
  Droplets,
  Fuel,
  Handshake,
  LayoutDashboard,
  Map,
  Settings,
  Truck,
  Users,
} from "lucide-react";
import type { NavigationItem } from "@/types/app-shell";

export const primaryNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Indicadores gerenciais e consumo consolidado",
  },
  {
    label: "Entradas",
    href: "/entradas",
    icon: Droplets,
    description: "Entradas normais de compra e recebimento",
  },
  {
    label: "Saidas",
    href: "/saidas",
    icon: Fuel,
    description: "Saidas operacionais por area e equipamento",
  },
  {
    label: "Emprestimos",
    href: "/emprestimos",
    icon: Handshake,
    description: "Movimentacoes com parceiros somando ou reduzindo saldo",
  },
  {
    label: "Relatorios",
    href: "/relatorios",
    icon: BarChart3,
    description: "Consultas filtradas e exportacao gerencial",
  },
  {
    label: "Configuracoes",
    href: "/configuracoes",
    icon: Settings,
    description: "Email automatico, frequencia de envio e parametros do sistema",
  },
];

export const registryNavigation: NavigationItem[] = [
  {
    label: "Combustiveis",
    href: "/cadastros/combustiveis",
    icon: ClipboardList,
    description: "Tipos de combustivel e codigos internos",
  },
  {
    label: "Areas",
    href: "/cadastros/areas",
    icon: Map,
    description: "Departamentos, centros e frentes operacionais",
  },
  {
    label: "Equipamentos",
    href: "/cadastros/equipamentos",
    icon: Truck,
    description: "Maquinas, veiculos e vinculos padrao",
  },
  {
    label: "Usuarios",
    href: "/cadastros/usuarios",
    icon: Users,
    description: "Perfis de acesso e administracao",
  },
];
