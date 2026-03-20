import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { FormField } from "@/components/forms/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useInventoryData, type ProductCategory } from "@/contexts/inventory/inventory-data-context";
import { supabaseClient } from "@/services/firebase/client";

const categories: ProductCategory[] = ["Pecas", "Movelaria", "Material eletrico", "Ferramentas", "EPI", "Outros"];

const parseDecimal = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  return normalized ? Number(normalized) : Number.NaN;
};

const productSchema = z.object({
  nome: z.string().min(2, "Informe o nome do produto"),
  categoria: z.string().min(1, "Selecione a categoria"),
  unidade: z.string().min(1, "Informe a unidade"),
  areaResponsavel: z.string().min(2, "Selecione a area responsavel"),
  estoqueMinimo: z.preprocess(parseDecimal, z.number().min(0, "Informe o estoque minimo")),
  descricao: z.string().optional(),
});

type ProductFormData = {
  nome: string;
  categoria: string;
  unidade: string;
  areaResponsavel: string;
  estoqueMinimo: string;
  descricao: string;
};

type ProductErrors = Partial<Record<keyof ProductFormData, string>>;

const initialForm: ProductFormData = {
  nome: "",
  categoria: "",
  unidade: "UN",
  areaResponsavel: "",
  estoqueMinimo: "",
  descricao: "",
};

function getCategoryTone(category: ProductCategory) {
  switch (category) {
    case "Pecas":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "Movelaria":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Material eletrico":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "Ferramentas":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "EPI":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function ProdutosPage() {
  const { products, stock, addProduct, isRemoteMode, isSyncing, syncError } = useInventoryData();
  const [form, setForm] = useState<ProductFormData>(initialForm);
  const [errors, setErrors] = useState<ProductErrors>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [areas, setAreas] = useState<string[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError, setAreasError] = useState<string | null>(null);

  const activeProducts = useMemo(() => products.filter((item) => item.ativo), [products]);
  const fallbackAreas = useMemo(() => Array.from(new Set(activeProducts.map((item) => item.areaResponsavel).filter(Boolean))).sort(), [activeProducts]);
  const areaOptions = areas.length > 0 ? areas : fallbackAreas;

  useEffect(() => {
    let active = true;

    async function loadAreas() {
      if (!supabaseClient) {
        setAreas(fallbackAreas);
        return;
      }

      setAreasLoading(true);
      setAreasError(null);
      const { data, error } = await supabaseClient
        .from("areas")
        .select("nome")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (!active) return;

      if (error) {
        setAreasError("Nao foi possivel carregar as areas reais do sistema.");
        setAreas(fallbackAreas);
      } else {
        setAreas((data ?? []).map((item) => item.nome).filter(Boolean));
      }
      setAreasLoading(false);
    }

    void loadAreas();
    return () => {
      active = false;
    };
  }, [fallbackAreas]);

  const updateField = (field: keyof ProductFormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = productSchema.safeParse(form);
    if (!result.success) {
      const nextErrors: ProductErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ProductFormData | undefined;
        if (field) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await addProduct({
        nome: result.data.nome,
        categoria: result.data.categoria as ProductCategory,
        unidade: result.data.unidade.toUpperCase(),
        areaResponsavel: result.data.areaResponsavel,
        estoqueMinimo: result.data.estoqueMinimo,
        descricao: result.data.descricao,
        ativo: true,
      });

      setForm(initialForm);
      setErrors({});
      setMessage(isRemoteMode ? "Produto cadastrado e sincronizado com a API." : "Produto geral cadastrado com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao cadastrar produto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cadastros"
        title="Produtos gerais"
        description="Cadastre pecas, material de movelaria, itens eletricos e outros produtos para abastecer o controle de estoque por area."
        actions={<Button type="submit" form="produto-form" disabled={saving || isSyncing}>{saving ? "Salvando..." : "Salvar produto"}</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Novo produto de estoque" description="Cada item entra no estoque geral e depois pode ser consumido pelas areas operacionais.">
          <form id="produto-form" className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Nome do produto" error={errors.nome}>
                <Input placeholder="Ex.: Rolamento 6205" value={form.nome} onChange={(event) => updateField("nome", event.target.value)} />
              </FormField>
              <FormField label="Categoria" error={errors.categoria}>
                <Select value={form.categoria} onChange={(event) => updateField("categoria", event.target.value)}>
                  <option value="">Selecione</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </Select>
              </FormField>
              <FormField label="Unidade" error={errors.unidade}>
                <Input placeholder="UN, M, KG" value={form.unidade} onChange={(event) => updateField("unidade", event.target.value)} />
              </FormField>
              <FormField label="Area responsavel" error={errors.areaResponsavel}>
                <Select value={form.areaResponsavel} onChange={(event) => updateField("areaResponsavel", event.target.value)} disabled={areasLoading}>
                  <option value="">{areasLoading ? "Carregando areas..." : "Selecione"}</option>
                  {areaOptions.map((area) => <option key={area} value={area}>{area}</option>)}
                </Select>
              </FormField>
              <FormField label="Estoque minimo" error={errors.estoqueMinimo}>
                <Input type="text" inputMode="decimal" placeholder="5" value={form.estoqueMinimo} onChange={(event) => updateField("estoqueMinimo", event.target.value)} />
              </FormField>
            </div>
            <FormField label="Descricao" error={errors.descricao}>
              <Textarea placeholder="Aplicacao, especificacao tecnica e observacoes do item" className="min-h-24" value={form.descricao} onChange={(event) => updateField("descricao", event.target.value)} />
            </FormField>
            {areasError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{areasError}</div> : null}
            {isRemoteMode ? <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">Modo remoto ativo: cadastro sincronizado com Supabase/API.</div> : null}
            {syncError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{syncError}</div> : null}
            {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div> : null}
          </form>
        </SectionCard>

        <SectionCard title="Produtos ativos" description="Relacao dos itens que ja alimentam o estoque geral e suas respectivas areas responsaveis.">
          <div className="space-y-3">
            {activeProducts.map((product) => {
              const stockItem = stock.find((item) => item.produtoId === product.id);
              return (
                <div key={product.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{product.nome}</p>
                        <Badge className={getCategoryTone(product.categoria)}>{product.categoria}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">Area responsavel: {product.areaResponsavel}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Unidade: {product.unidade} | Estoque minimo: {product.estoqueMinimo.toLocaleString("pt-BR")}</p>
                      {product.descricao ? <p className="mt-2 text-sm text-muted-foreground">{product.descricao}</p> : null}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Saldo atual</p>
                      <p className={`text-lg font-semibold ${stockItem?.status === "baixo" ? "text-amber-700" : "text-foreground"}`}>
                        {stockItem?.saldoAtual.toLocaleString("pt-BR") ?? 0} {product.unidade}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
