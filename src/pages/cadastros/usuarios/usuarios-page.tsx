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
  nome: z.string().min(2, "Informe o nome"),
  email: z.string().email("Informe um email valido"),
  role: z.string().min(1, "Selecione o perfil"),
  ativo: z.string().min(1, "Selecione o status"),
});

type FormData = z.infer<typeof schema>;

export function UsuariosPage() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", email: "", role: "", ativo: "true" },
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Cadastros" title="Usuarios e perfis" description="Cadastro inicial de usuarios com definicao de papel administrativo." actions={<Button type="submit" form="usuario-form">Salvar usuario</Button>} />
      <SectionCard title="Novo usuario">
        <form id="usuario-form" className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((data) => console.log(data))}>
          <FormField label="Nome" error={form.formState.errors.nome?.message}>
            <Input placeholder="Maria Silva" {...form.register("nome")} />
          </FormField>
          <FormField label="Email" error={form.formState.errors.email?.message}>
            <Input type="email" placeholder="maria@empresa.com" {...form.register("email")} />
          </FormField>
          <FormField label="Perfil" error={form.formState.errors.role?.message}>
            <Select defaultValue="" {...form.register("role")}>
              <option value="" disabled>Selecione</option>
              <option value="admin">Admin</option>
              <option value="operador">Operador</option>
              <option value="gestor">Gestor</option>
            </Select>
          </FormField>
          <FormField label="Status" error={form.formState.errors.ativo?.message}>
            <Select {...form.register("ativo")}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </Select>
          </FormField>
        </form>
      </SectionCard>
    </div>
  );
}
