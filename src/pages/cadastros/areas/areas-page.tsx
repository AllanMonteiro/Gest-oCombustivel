import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/forms/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth/AuthContext";
import { createAreaApi, fetchAreasApi } from "@/services/modules/inventory-api-service";
import { useState, useEffect, useCallback } from "react";
import { Map, BadgeCheck, XCircle } from "lucide-react";

const schema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  descricao: z.string().min(2, "Informe a descrição"),
  ativo: z.string().min(1, "Selecione o status"),
});

type FormData = z.infer<typeof schema>;

export function AreasPage() {
  const { session } = useAuth();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", descricao: "", ativo: "true" },
  });

  const loadAreas = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const data = await fetchAreasApi(session.access_token);
      setAreas(data);
    } catch (error) {
      console.error("Erro ao carregar areas:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  const onSubmit = async (data: FormData) => {
    if (!session?.access_token) {
      setMessage("Erro: Você precisa estar logado.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await createAreaApi(session.access_token, {
        nome: data.nome,
        descricao: data.descricao,
        ativo: data.ativo === "true",
      });
      setMessage("Área cadastrada com sucesso!");
      form.reset();
      loadAreas();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao cadastrar área.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        eyebrow="Cadastros" 
        title="Áreas" 
        description="Cadastro de áreas operacionais e centros de consumo para rastreabilidade de custos e movimentações." 
        actions={
          <Button type="submit" form="area-form" disabled={saving}>
            {saving ? "Salvando..." : "Salvar área"}
          </Button>
        } 
      />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SectionCard title="Nova área">
            <form id="area-form" className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField label="Nome" error={form.formState.errors.nome?.message}>
                <Input placeholder="Área Norte" {...form.register("nome")} />
              </FormField>
              <FormField label="Status" error={form.formState.errors.ativo?.message}>
                <Select {...form.register("ativo")}>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </Select>
              </FormField>
              <FormField label="Descrição" error={form.formState.errors.descricao?.message}>
                <Textarea 
                  placeholder="Descrição da área ou frente operacional" 
                  rows={4}
                  {...form.register("descricao")} 
                />
              </FormField>
              {message ? (
                <div className={`px-4 py-3 rounded-2xl text-sm ${message.includes("Erro") ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"}`}>
                  {message}
                </div>
              ) : null}
            </form>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard title="Áreas Cadastradas">
            <div className="overflow-hidden">
              {loading && areas.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Carregando áreas...</p>
              ) : areas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Map className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-foreground">Nenhuma área encontrada</p>
                  <p className="mt-1 text-xs text-muted-foreground">Cadastre a primeira área operacional para começar.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {areas.map((area) => (
                    <div key={area.id} className="flex items-start justify-between py-4 first:pt-0 last:pb-0">
                      <div className="flex gap-4">
                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-muted text-sidebar-foreground/70">
                          <Map className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground">{area.nome}</h4>
                            {area.ativo ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                <BadgeCheck className="h-3 w-3" />
                                Ativo
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <XCircle className="h-3 w-3" />
                                Inativo
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{area.descricao}</p>
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(area.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

