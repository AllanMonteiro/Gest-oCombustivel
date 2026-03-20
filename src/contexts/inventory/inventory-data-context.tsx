import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { hasApiConfig } from "@/lib/config/env";
import {
  createInventoryEntryApi,
  createInventoryExitApi,
  createInventoryProductApi,
  fetchInventoryState,
  type RemoteInventoryEntry,
  type RemoteInventoryExit,
  type RemoteInventoryProduct,
  type RemoteInventoryStockItem,
} from "@/services/modules/inventory-api-service";

export type ProductCategory = "Pecas" | "Movelaria" | "Material eletrico" | "Ferramentas" | "EPI" | "Outros";

export interface InventoryProduct {
  id: string;
  nome: string;
  categoria: ProductCategory;
  unidade: string;
  areaResponsavel: string;
  estoqueMinimo: number;
  descricao?: string;
  ativo: boolean;
  createdAt: string;
}

export interface InventoryEntryRecord {
  id: string;
  data: string;
  produtoId: string;
  quantidade: number;
  custoUnitario: number;
  fornecedor: string;
  notaFiscal?: string;
  observacao?: string;
  createdAt: string;
}

export interface InventoryExitRecord {
  id: string;
  data: string;
  produtoId: string;
  quantidade: number;
  area: string;
  equipamento?: string;
  solicitante: string;
  aplicacao?: string;
  observacao?: string;
  createdAt: string;
}

export interface InventoryStockItem {
  produtoId: string;
  produtoNome: string;
  categoria: ProductCategory;
  unidade: string;
  areaResponsavel: string;
  quantidadeEntrada: number;
  quantidadeSaida: number;
  saldoAtual: number;
  custoMedio: number;
  valorEstoque: number;
  estoqueMinimo: number;
  status: "ok" | "baixo";
}

export interface InventoryAreaSummary {
  area: string;
  totalItensRetirados: number;
  quantidadeConsumida: number;
  valorConsumido: number;
  produtosAtendidos: number;
  ultimaMovimentacao?: string;
}

interface InventoryDataContextValue {
  products: InventoryProduct[];
  entries: InventoryEntryRecord[];
  exits: InventoryExitRecord[];
  stock: InventoryStockItem[];
  areaSummaries: InventoryAreaSummary[];
  totalItemsInStock: number;
  totalInventoryValue: number;
  isRemoteMode: boolean;
  isSyncing: boolean;
  syncError: string | null;
  addProduct: (product: Omit<InventoryProduct, "id" | "createdAt">) => Promise<void>;
  addEntry: (entry: Omit<InventoryEntryRecord, "id" | "createdAt">) => Promise<void>;
  addExit: (exit: Omit<InventoryExitRecord, "id" | "createdAt">) => Promise<void>;
  getProductById: (productId: string) => InventoryProduct | undefined;
  reloadData: () => Promise<void>;
}

interface PersistedInventoryData {
  products: InventoryProduct[];
  entries: InventoryEntryRecord[];
  exits: InventoryExitRecord[];
}

const STORAGE_KEY = "controle-combustivel-estoque-geral-v1";

const initialProducts: InventoryProduct[] = [
  {
    id: "prod-rolamento-6205",
    nome: "Rolamento 6205",
    categoria: "Pecas",
    unidade: "UN",
    areaResponsavel: "Manutencao",
    estoqueMinimo: 6,
    descricao: "Reposicao para bombas e motores de apoio.",
    ativo: true,
    createdAt: "2026-03-10T08:00:00.000Z",
  },
  {
    id: "prod-cadeira-caixa",
    nome: "Cadeira operacional",
    categoria: "Movelaria",
    unidade: "UN",
    areaResponsavel: "Administrativo",
    estoqueMinimo: 2,
    descricao: "Cadeira para postos administrativos e recepcao.",
    ativo: true,
    createdAt: "2026-03-10T08:10:00.000Z",
  },
  {
    id: "prod-cabo-16mm",
    nome: "Cabo flexivel 16mm",
    categoria: "Material eletrico",
    unidade: "M",
    areaResponsavel: "Oficina",
    estoqueMinimo: 30,
    descricao: "Uso em manutencao de quadros e extensoes.",
    ativo: true,
    createdAt: "2026-03-10T08:20:00.000Z",
  },
];

const initialEntries: InventoryEntryRecord[] = [
  {
    id: "ent-geral-1",
    data: "2026-03-11",
    produtoId: "prod-rolamento-6205",
    quantidade: 18,
    custoUnitario: 42.5,
    fornecedor: "Casa das Pecas",
    notaFiscal: "NF-9812",
    observacao: "Compra para manutencao preventiva.",
    createdAt: "2026-03-11T10:00:00.000Z",
  },
  {
    id: "ent-geral-2",
    data: "2026-03-12",
    produtoId: "prod-cadeira-caixa",
    quantidade: 6,
    custoUnitario: 389.9,
    fornecedor: "Moveis Forte",
    notaFiscal: "NF-5521",
    observacao: "Reposicao do escritorio principal.",
    createdAt: "2026-03-12T14:00:00.000Z",
  },
  {
    id: "ent-geral-3",
    data: "2026-03-13",
    produtoId: "prod-cabo-16mm",
    quantidade: 120,
    custoUnitario: 12.4,
    fornecedor: "Eletrica Sertao",
    notaFiscal: "NF-2041",
    observacao: "Material para servicos de campo.",
    createdAt: "2026-03-13T11:30:00.000Z",
  },
];

const initialExits: InventoryExitRecord[] = [
  {
    id: "sai-geral-1",
    data: "2026-03-14",
    produtoId: "prod-rolamento-6205",
    quantidade: 4,
    area: "Manutencao",
    equipamento: "Bomba 01",
    solicitante: "Equipe Oficina",
    aplicacao: "Troca em bomba de transferencia",
    observacao: "Atendimento OS-142.",
    createdAt: "2026-03-14T09:15:00.000Z",
  },
  {
    id: "sai-geral-2",
    data: "2026-03-15",
    produtoId: "prod-cadeira-caixa",
    quantidade: 2,
    area: "Administrativo",
    equipamento: "Recepcao principal",
    solicitante: "Recepcao",
    aplicacao: "Substituicao de mobiliario",
    observacao: "Nova sala de atendimento.",
    createdAt: "2026-03-15T13:10:00.000Z",
  },
  {
    id: "sai-geral-3",
    data: "2026-03-16",
    produtoId: "prod-cabo-16mm",
    quantidade: 35,
    area: "Operacao de Campo",
    equipamento: "Painel Campo Norte",
    solicitante: "Equipe Campo Norte",
    aplicacao: "Adequacao de alimentacao eletrica",
    observacao: "Trecho remoto.",
    createdAt: "2026-03-16T16:40:00.000Z",
  },
];

const InventoryDataContext = createContext<InventoryDataContextValue | null>(null);

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePersistedData(raw: PersistedInventoryData | null | undefined): PersistedInventoryData {
  if (!raw) {
    return {
      products: initialProducts,
      entries: initialEntries,
      exits: initialExits,
    };
  }

  return {
    products: Array.isArray(raw.products) ? raw.products : initialProducts,
    entries: Array.isArray(raw.entries) ? raw.entries : initialEntries,
    exits: Array.isArray(raw.exits) ? raw.exits : initialExits,
  };
}

function buildStock(products: InventoryProduct[], entries: InventoryEntryRecord[], exits: InventoryExitRecord[]) {
  return products
    .filter((product) => product.ativo)
    .map((product) => {
      const relatedEntries = entries.filter((item) => item.produtoId === product.id);
      const relatedExits = exits.filter((item) => item.produtoId === product.id);
      const quantidadeEntrada = relatedEntries.reduce((sum, item) => sum + item.quantidade, 0);
      const quantidadeSaida = relatedExits.reduce((sum, item) => sum + item.quantidade, 0);
      const saldoAtual = Math.max(0, quantidadeEntrada - quantidadeSaida);
      const valorTotalEntradas = relatedEntries.reduce((sum, item) => sum + item.quantidade * item.custoUnitario, 0);
      const custoMedio = quantidadeEntrada > 0 ? valorTotalEntradas / quantidadeEntrada : 0;

      return {
        produtoId: product.id,
        produtoNome: product.nome,
        categoria: product.categoria,
        unidade: product.unidade,
        areaResponsavel: product.areaResponsavel,
        quantidadeEntrada: round(quantidadeEntrada),
        quantidadeSaida: round(quantidadeSaida),
        saldoAtual: round(saldoAtual),
        custoMedio: round(custoMedio),
        valorEstoque: round(saldoAtual * custoMedio),
        estoqueMinimo: product.estoqueMinimo,
        status: saldoAtual <= product.estoqueMinimo ? "baixo" : "ok",
      } satisfies InventoryStockItem;
    })
    .sort((left, right) => left.produtoNome.localeCompare(right.produtoNome));
}

function buildAreaSummaries(products: InventoryProduct[], entries: InventoryEntryRecord[], exits: InventoryExitRecord[]) {
  const grouped = new Map<string, InventoryAreaSummary>();

  for (const item of exits) {
    const product = products.find((candidate) => candidate.id === item.produtoId);
    if (!product) continue;

    const current = grouped.get(item.area) ?? {
      area: item.area,
      totalItensRetirados: 0,
      quantidadeConsumida: 0,
      valorConsumido: 0,
      produtosAtendidos: 0,
      ultimaMovimentacao: undefined,
    };

    const productEntries = entries.filter((entry) => entry.produtoId === item.produtoId);
    const totalEntryQty = productEntries.reduce((sum, entry) => sum + entry.quantidade, 0);
    const totalEntryValue = productEntries.reduce((sum, entry) => sum + entry.quantidade * entry.custoUnitario, 0);
    const custoMedio = totalEntryQty > 0 ? totalEntryValue / totalEntryQty : 0;

    current.totalItensRetirados += 1;
    current.quantidadeConsumida += item.quantidade;
    current.valorConsumido += item.quantidade * custoMedio;
    current.ultimaMovimentacao = !current.ultimaMovimentacao || item.data > current.ultimaMovimentacao ? item.data : current.ultimaMovimentacao;
    grouped.set(item.area, current);
  }

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      quantidadeConsumida: round(item.quantidadeConsumida),
      valorConsumido: round(item.valorConsumido),
      produtosAtendidos: new Set(exits.filter((exit) => exit.area === item.area).map((exit) => exit.produtoId)).size,
    }))
    .sort((left, right) => right.quantidadeConsumida - left.quantidadeConsumida);
}

function toLocalProduct(item: RemoteInventoryProduct): InventoryProduct {
  return {
    id: item.id,
    nome: item.nome,
    categoria: item.categoria,
    unidade: item.unidade,
    areaResponsavel: item.area_responsavel,
    estoqueMinimo: Number(item.estoque_minimo ?? 0),
    descricao: item.descricao ?? undefined,
    ativo: item.ativo,
    createdAt: item.created_at,
  };
}

function toLocalEntry(item: RemoteInventoryEntry): InventoryEntryRecord {
  return {
    id: item.id,
    data: item.data,
    produtoId: item.produto_id,
    quantidade: Number(item.quantidade ?? 0),
    custoUnitario: Number(item.custo_unitario ?? 0),
    fornecedor: item.fornecedor,
    notaFiscal: item.nota_fiscal ?? undefined,
    observacao: item.observacao ?? undefined,
    createdAt: item.created_at,
  };
}

function toLocalExit(item: RemoteInventoryExit): InventoryExitRecord {
  return {
    id: item.id,
    data: item.data,
    produtoId: item.produto_id,
    quantidade: Number(item.quantidade ?? 0),
    area: item.area,
    equipamento: item.equipamento ?? undefined,
    solicitante: item.solicitante,
    aplicacao: item.aplicacao ?? undefined,
    observacao: item.observacao ?? undefined,
    createdAt: item.created_at,
  };
}

function toLocalStock(item: RemoteInventoryStockItem): InventoryStockItem {
  return {
    produtoId: item.produto_id,
    produtoNome: item.produto_nome,
    categoria: item.categoria,
    unidade: item.unidade,
    areaResponsavel: item.area_responsavel,
    quantidadeEntrada: Number(item.quantidade_entrada ?? 0),
    quantidadeSaida: Number(item.quantidade_saida ?? 0),
    saldoAtual: Number(item.saldo_atual ?? 0),
    custoMedio: Number(item.custo_medio ?? 0),
    valorEstoque: Number(item.valor_estoque ?? 0),
    estoqueMinimo: Number(item.estoque_minimo ?? 0),
    status: Number(item.saldo_atual ?? 0) <= Number(item.estoque_minimo ?? 0) ? "baixo" : "ok",
  };
}

export function InventoryDataProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, profile, session } = useAuth();
  const [products, setProducts] = useState<InventoryProduct[]>(initialProducts);
  const [entries, setEntries] = useState<InventoryEntryRecord[]>(initialEntries);
  const [exits, setExits] = useState<InventoryExitRecord[]>(initialExits);
  const [remoteStock, setRemoteStock] = useState<InventoryStockItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const token = session?.access_token;
  const isRemoteMode = hasApiConfig && isAuthenticated && Boolean(token);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = normalizePersistedData(JSON.parse(raw) as PersistedInventoryData);
      setProducts(parsed.products);
      setEntries(parsed.entries);
      setExits(parsed.exits);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, entries, exits }));
  }, [products, entries, exits]);

  const reloadData = async () => {
    if (!token || !isRemoteMode) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const state = await fetchInventoryState(token);
      setProducts(state.products.map(toLocalProduct));
      setEntries(state.entries.map(toLocalEntry));
      setExits(state.exits.map(toLocalExit));
      setRemoteStock(state.stock.map(toLocalStock));
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Falha ao sincronizar estoque geral.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!isRemoteMode) return;
    void reloadData();
  }, [isRemoteMode, token]);

  const localStock = useMemo(() => buildStock(products, entries, exits), [products, entries, exits]);
  const stock = useMemo(() => (isRemoteMode ? remoteStock : localStock), [isRemoteMode, remoteStock, localStock]);
  const areaSummaries = useMemo(() => buildAreaSummaries(products, entries, exits), [products, entries, exits]);
  const totalItemsInStock = useMemo(() => round(stock.reduce((sum, item) => sum + item.saldoAtual, 0)), [stock]);
  const totalInventoryValue = useMemo(() => round(stock.reduce((sum, item) => sum + item.valorEstoque, 0)), [stock]);

  const value = useMemo<InventoryDataContextValue>(() => ({
    products,
    entries,
    exits,
    stock,
    areaSummaries,
    totalItemsInStock,
    totalInventoryValue,
    isRemoteMode,
    isSyncing,
    syncError,
    addProduct: async (product) => {
      if (isRemoteMode && token) {
        await createInventoryProductApi(token, {
          nome: product.nome,
          categoria: product.categoria,
          unidade: product.unidade,
          areaResponsavel: product.areaResponsavel,
          estoqueMinimo: product.estoqueMinimo,
          descricao: product.descricao,
          ativo: product.ativo,
        });
        await reloadData();
        return;
      }

      setProducts((current) => [
        {
          ...product,
          id: createId("prod"),
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
    },
    addEntry: async (entry) => {
      if (isRemoteMode && token) {
        await createInventoryEntryApi(token, {
          data: entry.data,
          produtoId: entry.produtoId,
          quantidade: entry.quantidade,
          custoUnitario: entry.custoUnitario,
          fornecedor: entry.fornecedor,
          notaFiscal: entry.notaFiscal,
          observacao: entry.observacao,
        });
        await reloadData();
        return;
      }

      setEntries((current) => [
        {
          ...entry,
          id: createId("ent-geral"),
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
    },
    addExit: async (exit) => {
      if (isRemoteMode && token) {
        await createInventoryExitApi(token, {
          data: exit.data,
          produtoId: exit.produtoId,
          quantidade: exit.quantidade,
          area: exit.area,
          equipamento: exit.equipamento,
          solicitante: exit.solicitante,
          aplicacao: exit.aplicacao,
          observacao: exit.observacao,
        });
        await reloadData();
        return;
      }

      setExits((current) => [
        {
          ...exit,
          id: createId("sai-geral"),
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
    },
    getProductById: (productId) => products.find((product) => product.id === productId),
    reloadData,
  }), [products, entries, exits, stock, areaSummaries, totalItemsInStock, totalInventoryValue, isRemoteMode, isSyncing, syncError, token]);

  return <InventoryDataContext.Provider value={value}>{children}</InventoryDataContext.Provider>;
}

export function useInventoryData() {
  const context = useContext(InventoryDataContext);
  if (!context) throw new Error("useInventoryData must be used within InventoryDataProvider");
  return context;
}
