
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Trabalho/01-Programação/ControleCombustivel/server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetDatabase() {
  console.log('Iniciando reset das movimentações e estoque...');

  // 1. Limpar Combustível
  console.log('Limpando movimentações de combustível...');
  const { error: errEntradasComb } = await supabase.from('entradas_combustivel').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: errSaidasComb } = await supabase.from('saidas_combustivel').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Zeroando saldos de combustível...');
  const { error: errEstoqueComb } = await supabase.from('estoque_combustivel').update({
    total_litros: 0,
    custo_medio: 0,
    valor_total_estoque: 0
  }).neq('id', '00000000-0000-0000-0000-000000000000');

  // 2. Limpar Inventário (Estoque Geral)
  console.log('Limpando movimentações de inventário...');
  const { error: errEntradasProd } = await supabase.from('entradas_produtos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: errSaidasProd } = await supabase.from('saidas_produtos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Zeroando saldos de inventário...');
  const { error: errEstoqueProd } = await supabase.from('estoque_produtos').update({
    quantidade_entrada: 0,
    quantidade_saida: 0,
    saldo_atual: 0,
    custo_medio: 0,
    valor_estoque: 0
  }).neq('id', '00000000-0000-0000-0000-000000000000');

  // 3. Limpar Auditoria (opcional, mas recomendado para um reset total)
  console.log('Limpando logs de auditoria...');
  const { error: errAudit } = await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const errors = [errEntradasComb, errSaidasComb, errEstoqueComb, errEntradasProd, errSaidasProd, errEstoqueProd, errAudit].filter(Boolean);

  if (errors.length > 0) {
    console.error('Ocorreram erros durante a limpeza:');
    errors.forEach(e => console.error(e));
  } else {
    console.log('Sucesso! Todas as movimentações e estoques foram zerados.');
  }
}

resetDatabase();
