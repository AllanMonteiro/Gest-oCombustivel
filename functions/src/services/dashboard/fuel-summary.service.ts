import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getEstoqueSnapshot, getPartnerLoanBalances } from "../../repositories/firestore/fuel-summary.repository";
import type { FuelSummarySnapshot } from "../../types";

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function formatLiters(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function getFuelSummarySnapshot(): Promise<FuelSummarySnapshot> {
  const [stockItems, partnerBalances] = await Promise.all([
    getEstoqueSnapshot(),
    getPartnerLoanBalances(),
  ]);

  const totalStockLiters = round(stockItems.reduce((sum, item) => sum + item.total_litros, 0));
  const totalEstimatedValue = round(stockItems.reduce((sum, item) => sum + item.valor_total_estoque, 0));
  const totalLoanInLiters = round(
    partnerBalances.reduce((sum, item) => sum + item.litrosEmprestadosPorParceiros, 0),
  );
  const totalLoanOutLiters = round(
    partnerBalances.reduce((sum, item) => sum + item.litrosEmprestadosPorNos, 0),
  );
  const totalOwedLiters = round(partnerBalances.reduce((sum, item) => sum + item.saldoDevendo, 0));

  return {
    totalStockLiters,
    totalEstimatedValue,
    stockItems,
    totalLoanInLiters,
    totalLoanOutLiters,
    totalOwedLiters,
    partnerBalances,
    generatedAtIso: new Date().toISOString(),
  };
}

export function buildFuelSummaryEmail(snapshot: FuelSummarySnapshot) {
  const generatedAt = new Date(snapshot.generatedAtIso);
  const generatedLabel = format(generatedAt, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
  const subject = `Resumo automatico de combustivel - ${format(generatedAt, "dd/MM/yyyy", { locale: ptBR })}`;

  const stockLines = snapshot.stockItems.length
    ? snapshot.stockItems
        .map(
          (item) =>
            `- ${item.combustivel_nome}: ${formatLiters(item.total_litros)} | custo medio ${formatCurrency(item.custo_medio)} | estoque ${formatCurrency(item.valor_total_estoque)}`,
        )
        .join("\n")
    : "- Nenhum saldo de combustivel encontrado.";

  const partnerLines = snapshot.partnerBalances.length
    ? snapshot.partnerBalances
        .map(
          (item) =>
            `- ${item.partnerName}: devendo ${formatLiters(item.saldoDevendo)} | a receber ${formatLiters(item.saldoAReceber)}`,
        )
        .join("\n")
    : "- Nenhum saldo com parceiros encontrado.";

  const text = [
    `Resumo gerado em ${generatedLabel}.`,
    "",
    `Estoque total: ${formatLiters(snapshot.totalStockLiters)}`,
    `Valor estimado: ${formatCurrency(snapshot.totalEstimatedValue)}`,
    `Emprestimo recebido: ${formatLiters(snapshot.totalLoanInLiters)}`,
    `Emprestimo enviado: ${formatLiters(snapshot.totalLoanOutLiters)}`,
    `Quanto devemos: ${formatLiters(snapshot.totalOwedLiters)}`,
    "",
    "Saldo por combustivel:",
    stockLines,
    "",
    "Saldo com parceiros:",
    partnerLines,
  ].join("\n");

  const stockRows = snapshot.stockItems.length
    ? snapshot.stockItems
        .map(
          (item) => `
            <tr>
              <td style="padding:10px 12px;border-bottom:1px solid #dbe5e2;">${escapeHtml(item.combustivel_nome)}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #dbe5e2;text-align:right;">${formatLiters(item.total_litros)}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #dbe5e2;text-align:right;">${formatCurrency(item.custo_medio)}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #dbe5e2;text-align:right;">${formatCurrency(item.valor_total_estoque)}</td>
            </tr>`,
        )
        .join("")
    : `
      <tr>
        <td colspan="4" style="padding:14px 12px;text-align:center;color:#5b6663;">Nenhum saldo de combustivel encontrado.</td>
      </tr>`;

  const partnerRows = snapshot.partnerBalances.length
    ? snapshot.partnerBalances
        .map(
          (item) => `
            <tr>
              <td style="padding:10px 12px;border-bottom:1px solid #dbe5e2;">${escapeHtml(item.partnerName)}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #dbe5e2;text-align:right;">${formatLiters(item.saldoDevendo)}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #dbe5e2;text-align:right;">${formatLiters(item.saldoAReceber)}</td>
            </tr>`,
        )
        .join("")
    : `
      <tr>
        <td colspan="3" style="padding:14px 12px;text-align:center;color:#5b6663;">Nenhum saldo com parceiros encontrado.</td>
      </tr>`;

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#f7f8f4;padding:24px;color:#17342f;">
      <div style="max-width:960px;margin:0 auto;background:#ffffff;border:1px solid #dbe5e2;border-radius:20px;overflow:hidden;">
        <div style="padding:24px 28px;background:linear-gradient(135deg,#163d5a 0%,#1f6e8a 60%,#35b7a7 100%);color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;opacity:0.85;">Controle de Combustivel</div>
          <h1 style="margin:10px 0 6px;font-size:28px;line-height:1.2;">Resumo automatico de estoque e emprestimos</h1>
          <p style="margin:0;font-size:14px;opacity:0.92;">Gerado em ${escapeHtml(generatedLabel)}</p>
        </div>
        <div style="padding:24px 28px;">
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:24px;">
            <div style="background:#f4faf8;border:1px solid #dbe5e2;border-radius:16px;padding:18px;">
              <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#1f6e8a;">Estoque total</div>
              <div style="margin-top:8px;font-size:26px;font-weight:700;">${formatLiters(snapshot.totalStockLiters)}</div>
              <div style="margin-top:6px;color:#5b6663;">Valor estimado ${formatCurrency(snapshot.totalEstimatedValue)}</div>
            </div>
            <div style="background:#f4faf8;border:1px solid #dbe5e2;border-radius:16px;padding:18px;">
              <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#1f6e8a;">Emprestimos</div>
              <div style="margin-top:8px;font-size:16px;line-height:1.7;">
                <div>Recebido: <strong>${formatLiters(snapshot.totalLoanInLiters)}</strong></div>
                <div>Enviado: <strong>${formatLiters(snapshot.totalLoanOutLiters)}</strong></div>
                <div>Devendo: <strong>${formatLiters(snapshot.totalOwedLiters)}</strong></div>
              </div>
            </div>
          </div>

          <h2 style="margin:0 0 12px;font-size:18px;">Saldo por combustivel</h2>
          <table style="width:100%;border-collapse:collapse;border:1px solid #dbe5e2;border-radius:16px;overflow:hidden;margin-bottom:24px;">
            <thead style="background:#edf5f3;">
              <tr>
                <th style="padding:12px;text-align:left;">Combustivel</th>
                <th style="padding:12px;text-align:right;">Litros</th>
                <th style="padding:12px;text-align:right;">Custo medio</th>
                <th style="padding:12px;text-align:right;">Valor em estoque</th>
              </tr>
            </thead>
            <tbody>${stockRows}</tbody>
          </table>

          <h2 style="margin:0 0 12px;font-size:18px;">Saldo com parceiros</h2>
          <table style="width:100%;border-collapse:collapse;border:1px solid #dbe5e2;border-radius:16px;overflow:hidden;">
            <thead style="background:#edf5f3;">
              <tr>
                <th style="padding:12px;text-align:left;">Parceiro</th>
                <th style="padding:12px;text-align:right;">Devendo</th>
                <th style="padding:12px;text-align:right;">A receber</th>
              </tr>
            </thead>
            <tbody>${partnerRows}</tbody>
          </table>
        </div>
      </div>
    </div>`;

  return { subject, text, html };
}
