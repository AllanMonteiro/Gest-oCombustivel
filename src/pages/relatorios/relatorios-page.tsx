import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/forms/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const schema = z.object({
  dataInicial: z.string().optional(),
  dataFinal: z.string().optional(),
  combustivel: z.string().optional(),
  area: z.string().optional(),
  equipamento: z.string().optional(),
  usuario: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function RelatoriosPage() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dataInicial: "",
      dataFinal: "",
      combustivel: "",
      area: "",
      equipamento: "",
      usuario: "",
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Analises" title="Relatorios gerenciais" description="Os filtros principais ja estao disponiveis para consulta e futura exportacao CSV." actions={<Button type="submit" form="relatorio-form">Aplicar filtros</Button>} />
      <SectionCard title="Filtros do relatorio" description="Vamos conectar este filtro as consultas agregadas do Firestore nas proximas etapas.">
        <form id="relatorio-form" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={form.handleSubmit((data) => console.log(data))}>
          <FormField label="Periodo inicial">
            <Input type="date" {...form.register("dataInicial")} />
          </FormField>
          <FormField label="Periodo final">
            <Input type="date" {...form.register("dataFinal")} />
          </FormField>
          <FormField label="Combustivel">
            <Select {...form.register("combustivel")}>
              <option value="">Todos</option>
              <option>Diesel S10</option>
              <option>Diesel S500</option>
              <option>Gasolina</option>
              <option>Etanol</option>
            </Select>
          </FormField>
          <FormField label="Area">
            <Select {...form.register("area")}>
              <option value="">Todas</option>
              <option>Area Norte</option>
              <option>Area Sul</option>
              <option>Manutencao</option>
            </Select>
          </FormField>
          <FormField label="Equipamento">
            <Select {...form.register("equipamento")}>
              <option value="">Todos</option>
              <option>Trator 01</option>
              <option>Escavadeira X</option>
              <option>Caminhao 12</option>
            </Select>
          </FormField>
          <FormField label="Usuario">
            <Input placeholder="Nome do usuario" {...form.register("usuario")} />
          </FormField>
        </form>
      </SectionCard>
    </div>
  );
}
