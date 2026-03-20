alter table public.saidas_produtos
add column if not exists equipamento text;

create index if not exists idx_saidas_produtos_equipamento on public.saidas_produtos (equipamento) where equipamento is not null;
