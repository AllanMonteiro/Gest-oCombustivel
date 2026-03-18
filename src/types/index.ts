// src/types/index.ts

// Tipos base
export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'operador' | 'gestor';
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Combustivel {
  id: string;
  nome: string;
  codigo: string;
  unidade: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Area {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Equipamento {
  id: string;
  nome: string;
  tipo: string;
  area_padrao_id: string;
  area_padrao_nome: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EntradaCombustivel {
  id: string;
  data: Date;
  fornecedor: string;
  combustivel_id: string;
  combustivel_nome: string;
  litros: number;
  valor_litro: number;
  valor_total: number;
  nota_fiscal: string;
  observacao: string;
  created_by_id: string;
  created_by_nome: string;
  created_at: Date;
  updated_at: Date;
}

export interface SaidaCombustivel {
  id: string;
  data: Date;
  combustivel_id: string;
  combustivel_nome: string;
  litros: number;
  usuario_id: string;
  usuario_nome: string;
  area_id: string;
  area_nome: string;
  equipamento_id: string;
  equipamento_nome: string;
  observacao: string;
  created_by_id: string;
  created_by_nome: string;
  created_at: Date;
  updated_at: Date;
}

export interface EstoqueCombustivel {
  id: string;
  combustivel_id: string;
  combustivel_nome: string;
  total_litros: number;
  custo_medio: number;
  valor_total_estoque: number;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  acao: string;
  entidade: string;
  entidade_id: string;
  dados_anteriores: any;
  dados_novos: any;
  usuario_id: string;
  usuario_nome: string;
  created_at: Date;
}

// Tipos para formulários
export interface EntradaForm {
  data: string;
  fornecedor: string;
  combustivel_id: string;
  litros: number;
  valor_litro: number;
  nota_fiscal: string;
  observacao: string;
}

export interface SaidaForm {
  data: string;
  combustivel_id: string;
  litros: number;
  usuario_id: string;
  area_id: string;
  equipamento_id: string;
  observacao: string;
}

// Tipos para dashboard
export interface DashboardData {
  estoqueTotal: number;
  valorTotalEstoque: number;
  entradasPeriodo: number;
  saidasPeriodo: number;
  estoquePorCombustivel: Array<{
    nome: string;
    litros: number;
    valor: number;
  }>;
  consumoPorArea: Array<{
    area: string;
    litros: number;
  }>;
  consumoPorEquipamento: Array<{
    equipamento: string;
    litros: number;
  }>;
  evolucaoConsumo: Array<{
    data: string;
    litros: number;
  }>;
  picosConsumo: {
    porArea: Array<{
      area: string;
      periodo: string;
      litros: number;
    }>;
    porEquipamento: Array<{
      equipamento: string;
      periodo: string;
      litros: number;
    }>;
  };
}

// Tipos para filtros
export interface FiltrosRelatorio {
  dataInicio: string;
  dataFim: string;
  combustivel_id?: string;
  area_id?: string;
  equipamento_id?: string;
  usuario_id?: string;
}