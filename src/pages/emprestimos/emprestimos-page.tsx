import { useMemo, useState } from "react";
import { z } from "zod";
import { FormField } from "@/components/forms/form-field";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFuelData, type EntryMovementType, type ExitMovementType, type FuelType } from "@/contexts/fuel/fuel-data-context";
import { getFuelTone, getMovementTone, getStatusTone } from "@/utils/constants/fuel-visuals";

const parseDecimal = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;
  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;
  const normalized = trimmed.includes(",") ? trimmed.replace(/\./g, "").replace(",", ".") : trimmed;
  return normalized ? Number(normalized) : Number.NaN;
};

const emprestimoSchema = z.object({
  data: z.string().min(1, "Informe a data"),
  combustivel: z.custom<FuelType>((value) => typeof value === "string" && value.length > 0, { message: "Selecione o combustivel" }),
  litros: z.preprocess(parseDecimal, z.number().positive("Informe os litros")),
  movementType: z.enum(["loan_in", "loan_out", "return_in", "return_out"]),
  partnerName: z.string().min(2, "Informe o parceiro"),
  observacao: z.string().optional(),
});

type EmprestimoFormData = {
  data: string;
  combustivel: string;
  litros: string;
  movementType: "loan_in" | "loan_out" | "return_in" | "return_out";
  partnerName: string;
  observacao: string;
};

type EmprestimoErrors = Partial<Record<keyof EmprestimoFormData, string>>;

type LedgerItem = {
  id: string;
  data: string;
  combustivel: FuelType;
  litros: number;
  movementType: EmprestimoFormData["movementType"];
  status: "active" | "cancelled";
  cancellationReason?: string;
  observacao?: string;
  partnerName: string;
};

type PartnerLedger = {
  partnerName: string;
  rows: Array<LedgerItem & { entrada: number; saida: number; saldoCorrente: number }>;
  saldoFinal: number;
};

const initialForm: EmprestimoFormData = {
  data: "",
  combustivel: "",
  litros: "",
  movementType: "loan_in",
  partnerName: "",
  observacao: "",
};

const movementLabels: Record<EmprestimoFormData["movementType"], string> = {
  loan_in: "Emprestimo recebido",
  loan_out: "Emprestimo enviado",
  return_in: "Devolucao recebida",
  return_out: "Devolucao enviada",
};

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function toLedgerDelta(item: LedgerItem) {
  if (item.movementType === "loan_out") return item.litros;
  if (item.movementType === "return_in") return -item.litros;
  if (item.movementType === "loan_in") return -item.litros;
  return item.litros;
}

export function EmprestimosPage() {
  const { entries, exits, addEntry, updateEntry, addExit, updateExit, cancelEntry, cancelExit, stockByFuel, isRemoteMode, isSyncing, syncError } = useFuelData();
  const [form, setForm] = useState<EmprestimoFormData>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<EmprestimoErrors>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const partnerEntries = useMemo(() => entries.filter((item) => item.movementType !== "regular"), [entries]);
  const partnerExits = useMemo(() => exits.filter((item) => item.movementType !== "regular"), [exits]);
  const movimentos = useMemo(() => [...partnerEntries, ...partnerExits].sort((a, b) => b.data.localeCompare(a.data)), [partnerEntries, partnerExits]);

  const partnerLedgers = useMemo<PartnerLedger[]>(() => {
    const grouped = new Map<string, LedgerItem[]>();

    for (const item of [...partnerEntries, ...partnerExits]) {
      const partnerName = item.partnerName || ("fornecedor" in item ? item.fornecedor : "Parceiro");
      if (!grouped.has(partnerName)) grouped.set(partnerName, []);
      grouped.get(partnerName)!.push({
        id: item.id,
        data: item.data,
        combustivel: item.combustivel,
        litros: item.litros,
        movementType: item.movementType as EmprestimoFormData["movementType"],
        status: item.status,
        cancellationReason: item.cancellationReason,
        observacao: item.observacao,
        partnerName,
      });
    }

    return Array.from(grouped.entries())
      .map(([partnerName, rows]) => {
        let saldoCorrente = 0;
        const orderedRows = [...rows].sort((a, b) => a.data.localeCompare(b.data)).map((row) => {
          const entrada = row.movementType === "loan_in" || row.movementType === "return_in" ? row.litros : 0;
          const saida = row.movementType === "loan_out" || row.movementType === "return_out" ? row.litros : 0;
          const delta = row.status === "active" ? toLedgerDelta(row) : 0;
          saldoCorrente = round(saldoCorrente + delta);
          return { ...row, entrada, saida, saldoCorrente };
        });

        return { partnerName, rows: orderedRows, saldoFinal: saldoCorrente };
      })
      .sort((a, b) => a.partnerName.localeCompare(b.partnerName));
  }, [partnerEntries, partnerExits]);

  const updateField = (field: keyof EmprestimoFormData, value: string) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage("");
    setForm((current) => ({ ...current, [field]: value as never }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setErrors({});
  };

  const handleEdit = (row: LedgerItem) => {
    setEditingId(row.id);
    setErrors({});
    setMessage("");
    setForm({
      data: row.data,
      combustivel: row.combustivel,
      litros: String(row.litros).replace(".", ","),
      movementType: row.movementType,
      partnerName: row.partnerName,
      observacao: row.observacao ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = emprestimoSchema.safeParse(form);
    if (!result.success) {
      const nextErrors: EmprestimoErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof EmprestimoFormData | undefined;
        if (field) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    const data = result.data;
    const stockItem = stockByFuel.find((item) => item.combustivel === data.combustivel);
    const originalItem = editingId ? movimentos.find((item) => item.id === editingId) : null;
    const originalLitrosMesmoCombustivel = originalItem && originalItem.movementType !== "loan_in" && originalItem.movementType !== "return_in" && originalItem.combustivel === data.combustivel ? originalItem.litros : 0;
    const saldoAtual = (stockItem?.saldoLitros ?? 0) + originalLitrosMesmoCombustivel;
    if ((data.movementType === "loan_out" || data.movementType === "return_out") && data.litros > saldoAtual) {
      setErrors({ litros: `Saldo insuficiente para ${data.combustivel}. Disponivel: ${saldoAtual.toLocaleString("pt-BR")} L` });
      setMessage("");
      return;
    }

    setSaving(true);
    try {
      if (data.movementType === "loan_in" || data.movementType === "return_in") {
        const payload = {
          data: data.data,
          fornecedor: data.partnerName,
          combustivel: data.combustivel,
          litros: data.litros,
          valorLitro: 0,
          notaFiscal: "PARCEIRO",
          observacao: data.observacao,
          movementType: data.movementType as EntryMovementType,
          partnerName: data.partnerName,
        };

        if (editingId) {
          await updateEntry(editingId, payload);
        } else {
          await addEntry(payload);
        }
      } else {
        const payload = {
          data: data.data,
          combustivel: data.combustivel,
          litros: data.litros,
          usuarioNome: "",
          area: "",
          equipamento: "",
          observacao: data.observacao,
          movementType: data.movementType as ExitMovementType,
          partnerName: data.partnerName,
        };

        if (editingId) {
          await updateExit(editingId, payload);
        } else {
          await addExit(payload);
        }
      }

      resetForm();
      setMessage(editingId ? "Movimentacao atualizada com sucesso." : (isRemoteMode ? "Movimentacao sincronizada com Supabase/API com sucesso." : "Movimentacao de emprestimo registrada com sucesso."));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao registrar a movimentacao.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (row: LedgerItem) => {
    const reason = window.prompt("Informe a justificativa do cancelamento desta movimentacao de emprestimo:");
    if (!reason?.trim()) return;
    try {
      if (row.movementType === "loan_in" || row.movementType === "return_in") await cancelEntry(row.id, reason.trim());
      else await cancelExit(row.id, reason.trim());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao cancelar a movimentacao.");
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title={editingId ? "Editar movimentacao de parceiro" : "Nova movimentacao de parceiro"} description="Registre aqui emprestimos recebidos, enviados e devolucoes com parceiros. O efeito e direto no saldo por combustivel.">
        <form id="emprestimo-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <FormField label="Data" error={errors.data}><Input type="date" value={form.data} onChange={(event) => updateField("data", event.target.value)} /></FormField>
              <FormField label="Parceiro" error={errors.partnerName}><Input placeholder="Nome do parceiro" value={form.partnerName} onChange={(event) => updateField("partnerName", event.target.value)} /></FormField>
              <FormField label="Tipo da movimentacao" error={errors.movementType}><Select value={form.movementType} onChange={(event) => updateField("movementType", event.target.value)}><option value="loan_in">Emprestimo recebido</option><option value="loan_out">Emprestimo enviado</option><option value="return_in">Devolucao recebida</option><option value="return_out">Devolucao enviada</option></Select></FormField>
              <FormField label="Combustivel" error={errors.combustivel}><Select value={form.combustivel} onChange={(event) => updateField("combustivel", event.target.value)}><option value="">Selecione</option><option>Diesel S10</option><option>Diesel S500</option><option>Gasolina</option><option>Etanol</option></Select></FormField>
              <FormField label="Quantidade em litros" error={errors.litros}><Input type="text" inputMode="decimal" placeholder="200 ou 200,50" value={form.litros} onChange={(event) => updateField("litros", event.target.value)} /></FormField>
            </div>
            <div className="flex gap-2">
              {editingId ? <Button type="button" variant="outline" size="sm" className="h-10 px-3" onClick={resetForm}>Cancelar edicao</Button> : null}
              <Button type="submit" size="sm" className="h-10 px-3 xl:min-w-[130px]" disabled={saving || isSyncing}>{saving ? "Salvando..." : editingId ? "Atualizar" : "Salvar"}</Button>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <FormField label="Observacao" error={errors.observacao}><Textarea placeholder="Detalhes do acordo, devolucao ou acerto com o parceiro" value={form.observacao} onChange={(event) => updateField("observacao", event.target.value)} className="min-h-24" /></FormField>
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">Essa movimentacao altera somente o saldo do combustivel e o controle com parceiros. Nao entra como entrada de compra nem como saida operacional.</div>
          </div>
          {isRemoteMode ? <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">Modo remoto ativo: emprestimos sincronizados com Supabase + API Render.</div> : null}
          {syncError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{syncError}</div> : null}
          {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div> : null}
        </form>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Conta corrente de emprestimos" description="Controle de entrada, saida e saldo acumulado por parceiro.">
          <div className="space-y-4 max-h-[720px] overflow-auto pr-1">{partnerLedgers.length > 0 ? partnerLedgers.map((ledger) => (<div key={ledger.partnerName} className="rounded-2xl border border-border bg-background p-4"><div className="flex items-center justify-between gap-4"><p className="font-semibold text-foreground">{ledger.partnerName}</p><Badge className={ledger.saldoFinal >= 0 ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-amber-100 text-amber-900 border border-amber-300"}>{ledger.saldoFinal >= 0 ? `A receber ${Math.abs(ledger.saldoFinal).toLocaleString("pt-BR")} L` : `Devendo ${Math.abs(ledger.saldoFinal).toLocaleString("pt-BR")} L`}</Badge></div><div className="mt-4 space-y-2">{ledger.rows.map((row) => { const fuelTone = getFuelTone(row.combustivel); const statusTone = getStatusTone(row.status); return <div key={row.id} className={`rounded-xl border p-3 ${fuelTone.card}`}><div className="flex flex-wrap items-center gap-2"><Badge className={getMovementTone(row.movementType)}>{movementLabels[row.movementType]}</Badge><Badge className={fuelTone.badge}>{row.combustivel}</Badge><Badge className={statusTone.badge}>{row.status === "active" ? "Ativa" : "Cancelada"}</Badge></div><div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-4"><span>{new Intl.DateTimeFormat("pt-BR").format(new Date(row.data))}</span><span>Entrada: {row.entrada.toLocaleString("pt-BR")} L</span><span>Saida: {row.saida.toLocaleString("pt-BR")} L</span><span>Saldo: {row.saldoCorrente.toLocaleString("pt-BR")} L</span></div>{row.observacao ? <p className="mt-2 text-sm text-muted-foreground">{row.observacao}</p> : null}{row.status === "cancelled" && row.cancellationReason ? <p className={`mt-2 text-sm ${statusTone.text}`}>Justificativa: {row.cancellationReason}</p> : null}{row.status === "active" ? <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => handleEdit(row)}>Editar</Button><Button size="sm" variant="outline" onClick={() => void handleCancel(row)}>Cancelar</Button></div> : null}</div>; })}</div></div>)) : <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-12 text-center text-sm text-muted-foreground">Nenhuma movimentacao com parceiros registrada.</div>}</div>
        </SectionCard>

        <SectionCard title="Saldo por combustivel" description="O impacto dos emprestimos no saldo total aparece imediatamente aqui.">
          <div className="grid gap-3">{stockByFuel.map((item) => { const tone = getFuelTone(item.combustivel); return <div key={item.combustivel} className={`rounded-2xl border p-4 ${tone.card}`}><div className="flex items-center justify-between gap-4"><div><div className="flex items-center gap-2"><p className="font-medium text-foreground">{item.combustivel}</p><Badge className={tone.badge}>{item.combustivel}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Saldo atual consolidado</p></div><p className={`font-semibold ${tone.accent}`}>{item.saldoLitros.toLocaleString("pt-BR")} L</p></div></div>; })}</div>
        </SectionCard>
      </div>
    </div>
  );
}