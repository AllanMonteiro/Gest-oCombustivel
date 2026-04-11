import { useMemo, useState } from "react";
import { z } from "zod";
import { FormField } from "@/components/forms/form-field";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFuelData, type FuelType } from "@/contexts/fuel/fuel-data-context";
import { getFuelTone, getStatusTone } from "@/utils/constants/fuel-visuals";

const parseDecimal = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;
  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;
  const normalized = trimmed.includes(",") ? trimmed.replace(/\./g, "").replace(",", ".") : trimmed;
  return normalized ? Number(normalized) : Number.NaN;
};

const saidaSchema = z.object({
  data: z.string().min(1, "Informe a data"),
  combustivel: z.custom<FuelType>((value) => typeof value === "string" && value.length > 0, { message: "Selecione o combustivel" }),
  litros: z.preprocess(parseDecimal, z.number().positive("Informe os litros")),
  usuarioNome: z.string().min(2, "Informe quem utilizou"),
  area: z.string().min(1, "Selecione a area"),
  equipamento: z.string().min(1, "Selecione o equipamento"),
  requisicao: z.string().min(2, "Informe a requisicao"),
  observacao: z.string().optional(),
});

type SaidaFormData = {
  data: string;
  combustivel: string;
  litros: string;
  usuarioNome: string;
  area: string;
  equipamento: string;
  requisicao: string;
  observacao: string;
};

type SaidaErrors = Partial<Record<keyof SaidaFormData, string>>;

const initialForm: SaidaFormData = {
  data: "",
  combustivel: "",
  litros: "",
  usuarioNome: "",
  area: "",
  equipamento: "",
  requisicao: "",
  observacao: "",
};

  export function SaidasPage() {
  const { exits, stockByFuel, addExit, cancelExit, isRemoteMode, isSyncing, syncError, areas, equipments, fuels } = useFuelData();
  const [mensagem, setMensagem] = useState("");
  const [errors, setErrors] = useState<SaidaErrors>({});
  const [form, setForm] = useState<SaidaFormData>(initialForm);
  const [saving, setSaving] = useState(false);

  // We filter to show only active registrations for new entries
  const activeAreas = useMemo(() => areas.filter(a => a.ativo), [areas]);
  const activeEquipments = useMemo(() => equipments.filter(e => e.ativo), [equipments]);
  const activeFuels = useMemo(() => fuels.filter(f => f.ativo), [fuels]);

  const regularExits = useMemo(() => exits.filter((item) => item.movementType === "regular"), [exits]);

  const updateField = (field: keyof SaidaFormData, value: string) => {
    setMensagem("");
    setErrors((current) => ({ ...current, [field]: undefined }));
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = saidaSchema.safeParse(form);
    if (!result.success) {
      const nextErrors: SaidaErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof SaidaFormData | undefined;
        if (field) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      setMensagem("");
      return;
    }

    const data = result.data;
    const stockItem = stockByFuel.find((item) => item.combustivel === data.combustivel);
    const saldoAtual = stockItem?.saldoLitros ?? 0;
    if (data.litros > saldoAtual) {
      setErrors({ litros: `Saldo insuficiente para ${data.combustivel}. Disponivel: ${saldoAtual.toLocaleString("pt-BR")} L` });
      setMensagem("");
      return;
    }

    setSaving(true);
    try {
      await addExit({
        data: data.data,
        combustivel: data.combustivel,
        litros: data.litros,
        usuarioNome: data.usuarioNome,
        area: data.area,
        equipamento: data.equipamento,
        requisicao: data.requisicao,
        observacao: data.observacao,
        movementType: "regular",
      });

      setMensagem(isRemoteMode ? "Saida sincronizada com Supabase/API com sucesso." : "Saida operacional registrada com sucesso.");
      setErrors({});
      setForm(initialForm);
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Falha ao registrar a saida.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (exitId: string) => {
    const reason = window.prompt("Informe a justificativa do cancelamento desta saida:");
    if (!reason?.trim()) return;
    try {
      await cancelExit(exitId, reason.trim());
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Falha ao cancelar a saida.");
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Nova saida operacional" description="Registre aqui apenas consumo operacional por area e equipamento. Emprestimos e devolucoes com parceiros ficam na aba `Emprestimos`.">
        <form id="saida-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
              <FormField label="Data" error={errors.data}><Input type="date" value={form.data} onChange={(event) => updateField("data", event.target.value)} /></FormField>
              <FormField label="Combustivel" error={errors.combustivel}>
                <Select value={form.combustivel} onChange={(event) => updateField("combustivel", event.target.value)}>
                  <option value="">Selecione</option>
                  {activeFuels.length > 0
                    ? activeFuels.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)
                    : <><option>Diesel S10</option><option>Diesel S500</option><option>Gasolina</option><option>Etanol</option></>
                  }
                </Select>
              </FormField>
              <FormField label="Litros" error={errors.litros}><Input type="text" inputMode="decimal" placeholder="180" value={form.litros} onChange={(event) => updateField("litros", event.target.value)} /></FormField>
              <FormField label="Quem utilizou" error={errors.usuarioNome}><Input placeholder="Nome do colaborador" value={form.usuarioNome} onChange={(event) => updateField("usuarioNome", event.target.value)} /></FormField>
              <FormField label="Area destino" error={errors.area}>
                <Select value={form.area} onChange={(event) => updateField("area", event.target.value)}>
                  <option value="">Selecione</option>
                  {activeAreas.length > 0 
                    ? activeAreas.map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)
                    : <><option>Area Norte</option><option>Area Sul</option><option>Manutencao</option><option>Operacao de Campo</option></>
                  }
                </Select>
              </FormField>
              <FormField label="Equipamento" error={errors.equipamento}>
                <Select value={form.equipamento} onChange={(event) => updateField("equipamento", event.target.value)}>
                  <option value="">Selecione</option>
                  {activeEquipments.length > 0 
                    ? activeEquipments.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)
                    : <><option>Trator 01</option><option>Escavadeira X</option><option>Caminhao 12</option></>
                  }
                </Select>
              </FormField>
              <FormField label="Requisicao" error={errors.requisicao}><Input placeholder="Numero ou codigo da requisicao" value={form.requisicao} onChange={(event) => updateField("requisicao", event.target.value)} /></FormField>
            </div>
            <Button type="submit" size="sm" className="h-10 px-3 xl:min-w-[130px]" disabled={saving || isSyncing}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
          <FormField label="Observacao" error={errors.observacao}><Textarea placeholder="Detalhes do consumo, atividade executada e observacoes" value={form.observacao} onChange={(event) => updateField("observacao", event.target.value)} className="min-h-24" /></FormField>
          {isRemoteMode ? <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">Modo remoto ativo: saidas sincronizadas com Supabase + API Render.</div> : null}
          {syncError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{syncError}</div> : null}
          {mensagem ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{mensagem}</div> : null}
        </form>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Saldo por combustivel" description="Disponivel antes do lancamento da saida e calculado com operacao normal mais emprestimos.">
          <div className="space-y-3">{stockByFuel.map((item) => { const tone = getFuelTone(item.combustivel); return <div key={item.combustivel} className={`rounded-2xl border p-4 ${tone.card}`}><div className="flex items-center justify-between gap-4"><div><div className="flex items-center gap-2"><p className="font-medium text-foreground">{item.combustivel}</p><Badge className={tone.badge}>{item.combustivel}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Saldo atual</p></div><p className={`font-semibold ${tone.accent}`}>{item.saldoLitros.toLocaleString("pt-BR")} L</p></div></div>; })}</div>
        </SectionCard>

        <SectionCard title="Ultimas saidas operacionais" description="Historico apenas do consumo operacional normal.">
          <div className="space-y-3">{regularExits.slice(0, 5).map((item) => { const fuelTone = getFuelTone(item.combustivel); const statusTone = getStatusTone(item.status); return <div key={item.id} className={`rounded-2xl border p-4 ${fuelTone.card}`}><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">{item.usuarioNome}</p><Badge className={statusTone.badge}>{item.status === "active" ? "Ativa" : "Cancelada"}</Badge><Badge className={fuelTone.badge}>{item.combustivel}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{new Intl.DateTimeFormat("pt-BR").format(new Date(item.data))}</p><p className="mt-1 text-sm text-muted-foreground">{item.area} - {item.equipamento}</p>{item.requisicao ? <p className="mt-1 text-sm text-muted-foreground">Requisicao: {item.requisicao}</p> : null}{item.status === "cancelled" && item.cancellationReason ? <p className={`mt-1 text-sm ${statusTone.text}`}>Justificativa: {item.cancellationReason}</p> : null}</div><div className="text-right"><p className="font-semibold text-foreground">{item.litros.toLocaleString("pt-BR")} L</p>{item.status === "active" ? <Button variant="outline" size="sm" className="mt-3" onClick={() => void handleCancel(item.id)}>Cancelar</Button> : null}</div></div></div>; })}</div>
        </SectionCard>
      </div>
    </div>
  );
}
