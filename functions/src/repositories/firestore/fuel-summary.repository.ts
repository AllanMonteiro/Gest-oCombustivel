import { db } from "../../config/firebase";
import type { EstoqueCombustivelRecord, PartnerLoanSummary } from "../../types";

interface EntryDoc {
  litros?: number;
  movementType?: "regular" | "loan_in" | "return_in";
  partnerName?: string;
  status?: "active" | "cancelled";
}

interface ExitDoc {
  litros?: number;
  movementType?: "regular" | "loan_out" | "return_out";
  partnerName?: string;
  status?: "active" | "cancelled";
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export async function getEstoqueSnapshot() {
  const snapshot = await db.collection("estoque_combustivel").get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Partial<EstoqueCombustivelRecord>;
    return {
      combustivel_id: data.combustivel_id ?? doc.id,
      combustivel_nome: data.combustivel_nome ?? doc.id,
      total_litros: toNumber(data.total_litros),
      custo_medio: toNumber(data.custo_medio),
      valor_total_estoque: toNumber(data.valor_total_estoque),
      updated_at: data.updated_at,
    } satisfies EstoqueCombustivelRecord;
  });
}

export async function getPartnerLoanBalances() {
  const [entriesSnapshot, exitsSnapshot] = await Promise.all([
    db.collection("entradas_combustivel").get(),
    db.collection("saidas_combustivel").get(),
  ]);

  const grouped = new Map<string, PartnerLoanSummary>();

  const ensurePartner = (partnerName: string) => {
    if (!grouped.has(partnerName)) {
      grouped.set(partnerName, {
        partnerName,
        litrosEmprestadosPorParceiros: 0,
        litrosDevolvidosAParceiros: 0,
        litrosEmprestadosPorNos: 0,
        litrosDevolvidosParaNos: 0,
        saldoDevendo: 0,
        saldoAReceber: 0,
      });
    }

    return grouped.get(partnerName)!;
  };

  for (const doc of entriesSnapshot.docs) {
    const data = doc.data() as EntryDoc;
    if (data.status === "cancelled" || !data.partnerName) continue;

    const partner = ensurePartner(data.partnerName);
    const litros = toNumber(data.litros);

    if (data.movementType === "loan_in") partner.litrosEmprestadosPorParceiros += litros;
    if (data.movementType === "return_in") partner.litrosDevolvidosParaNos += litros;
  }

  for (const doc of exitsSnapshot.docs) {
    const data = doc.data() as ExitDoc;
    if (data.status === "cancelled" || !data.partnerName) continue;

    const partner = ensurePartner(data.partnerName);
    const litros = toNumber(data.litros);

    if (data.movementType === "loan_out") partner.litrosEmprestadosPorNos += litros;
    if (data.movementType === "return_out") partner.litrosDevolvidosAParceiros += litros;
  }

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      litrosEmprestadosPorParceiros: round(item.litrosEmprestadosPorParceiros),
      litrosDevolvidosAParceiros: round(item.litrosDevolvidosAParceiros),
      litrosEmprestadosPorNos: round(item.litrosEmprestadosPorNos),
      litrosDevolvidosParaNos: round(item.litrosDevolvidosParaNos),
      saldoDevendo: round(Math.max(item.litrosEmprestadosPorParceiros - item.litrosDevolvidosAParceiros, 0)),
      saldoAReceber: round(Math.max(item.litrosEmprestadosPorNos - item.litrosDevolvidosParaNos, 0)),
    }))
    .sort((left, right) => left.partnerName.localeCompare(right.partnerName));
}
