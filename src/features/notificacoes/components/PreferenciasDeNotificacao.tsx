import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/core/components/ui/switch';
import type { PreferenciaDeNotificacao } from '@/services/notificacoes.services';
import { usePreferenciasDeNotificacao, useSalvarPreferenciasDeNotificacao } from '../hooks/useNotificacoes';

/** Os eventos na ordem do catálogo, por grupo. */
function porGrupo(preferencias: PreferenciaDeNotificacao[]): [string, PreferenciaDeNotificacao[]][] {
  const grupos = new Map<string, PreferenciaDeNotificacao[]>();
  for (const p of preferencias) grupos.set(p.grupo, [...(grupos.get(p.grupo) ?? []), p]);
  return [...grupos.entries()];
}

/**
 * O que a pessoa recebe por e-mail (SN-47). O sininho recebe tudo; aqui só se
 * escolhe o e-mail, evento a evento. Sem escolha, vale o padrão: ligado para o
 * que pede ação. Cada chave grava na hora; enquanto grava, as outras esperam —
 * duas respostas fora de ordem desfariam na tela a segunda escolha.
 */
export function PreferenciasDeNotificacao() {
  const preferencias = usePreferenciasDeNotificacao();
  const salvar = useSalvarPreferenciasDeNotificacao();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações por e-mail</CardTitle>
        <CardDescription>
          Todo aviso chega no sino. Escolha quais também vão para o seu e-mail.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {preferencias.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </p>
        ) : preferencias.isError ? (
          <div className="text-sm text-muted-foreground">
            <p>Não foi possível carregar as preferências.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => preferencias.refetch()}>
              Tentar de novo
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {porGrupo(preferencias.data ?? []).map(([grupo, eventos]) => (
              <section key={grupo} aria-labelledby={`grupo-${grupo}`}>
                <h3 id={`grupo-${grupo}`} className="mb-2 text-sm font-medium">{grupo}</h3>
                <ul className="divide-y rounded-md border">
                  {eventos.map((p) => (
                    <li key={p.evento} className="flex items-center justify-between gap-4 px-3 py-2">
                      <label htmlFor={`email-${p.evento}`} className="text-sm">
                        {p.nome}
                        {p.acao && <span className="ml-2 text-xs text-muted-foreground">pede ação</span>}
                      </label>
                      <Switch
                        id={`email-${p.evento}`}
                        checked={p.email}
                        disabled={salvar.isPending}
                        onCheckedChange={(email) => salvar.mutate([{ evento: p.evento, email }])}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
