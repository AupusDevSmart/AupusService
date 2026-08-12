// src/features/planos-manutencao/components/SeletorDePlanoField.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@aupus/shared-pages';
import { Link2, Unlink, AlertTriangle } from 'lucide-react';
import { usePlanoDoEquipamento } from './PlanoDoEquipamentoContext';
import {
  planosManutencaoApi,
  type PlanoManutencaoApiResponse,
} from '@/services/planos-manutencao.services';

interface SeletorDePlanoFieldProps {
  /** Nulo no cadastro, quando o equipamento ainda não existe. */
  equipamentoId: string | null;
  classificacao?: string;
  somenteLeitura?: boolean;
  /** Categoria escolhida no formulário. É ela que decide quais planos servem. */
  categoriaId?: string;
  /** Vincula o plano assim que o equipamento nasce, no modo cadastro. */
  registrarAcaoPosCriacao?: (
    chave: string,
    acao: (equipamentoId: string) => Promise<void>,
  ) => void;
}

/**
 * Escolha do plano de manutenção, como campo de Dados técnicos.
 *
 * Funciona nos dois momentos. Com equipamento salvo, aplica na hora. No
 * cadastro não há id para vincular, então os planos vêm pela categoria
 * escolhida no formulário e o vínculo é registrado para acontecer assim que o
 * equipamento for criado — quem cadastra já sabe qual plano quer e não deveria
 * ter que salvar, reabrir e voltar aqui.
 */
export function SeletorDePlanoField({
  equipamentoId,
  classificacao,
  somenteLeitura = false,
  categoriaId,
  registrarAcaoPosCriacao,
}: SeletorDePlanoFieldProps) {
  const criando = !equipamentoId;

  const {
    planoAtual,
    templates,
    carregando,
    salvando,
    ehUC,
    vincular,
    desvincular,
    escolherPlanoNoCadastro,
  } = usePlanoDoEquipamento(equipamentoId ?? '', classificacao);

  const [selecionado, setSelecionado] = React.useState('');
  const [templatesDaCategoria, setTemplatesDaCategoria] = React.useState<
    PlanoManutencaoApiResponse[]
  >([]);
  const [carregandoCategoria, setCarregandoCategoria] = React.useState(false);

  const planoOrigemAtual = (planoAtual?.plano_origem_id || '').trim();

  // Espelha o plano vinculado sempre que ele muda no servidor, sem atropelar
  // uma escolha que o usuário acabou de fazer e ainda não aplicou.
  React.useEffect(() => {
    if (!criando) setSelecionado(planoOrigemAtual);
  }, [criando, planoOrigemAtual]);

  // No cadastro os planos vêm da categoria, não do equipamento.
  React.useEffect(() => {
    if (!criando) return;

    const categoria = categoriaId?.trim();
    if (!categoria) {
      setTemplatesDaCategoria([]);
      setSelecionado('');
      return;
    }

    let cancelado = false;
    setCarregandoCategoria(true);

    planosManutencaoApi
      .listarTemplatesDaCategoria(categoria)
      .then((lista) => {
        if (cancelado) return;
        setTemplatesDaCategoria(lista);
        // Trocar de categoria invalida a escolha anterior.
        setSelecionado((atual) => (lista.some((p) => p.id?.trim() === atual) ? atual : ''));
      })
      .catch(() => {
        if (!cancelado) setTemplatesDaCategoria([]);
      })
      .finally(() => {
        if (!cancelado) setCarregandoCategoria(false);
      });

    return () => {
      cancelado = true;
    };
  }, [criando, categoriaId]);

  // Registra o vínculo para depois da criação. Roda a cada mudança de escolha
  // porque a ação captura o plano escolhido.
  // A aba de tarefas le esta escolha para mostrar o que sera copiado.
  React.useEffect(() => {
    if (criando) escolherPlanoNoCadastro(selecionado);
  }, [criando, selecionado, escolherPlanoNoCadastro]);

  React.useEffect(() => {
    if (!criando || !registrarAcaoPosCriacao) return;

    registrarAcaoPosCriacao('o plano de manutenção', async (novoId: string) => {
      if (!selecionado) return;
      await planosManutencaoApi.vincular({ equipamento_id: novoId, plano_id: selecionado });
    });
  }, [criando, selecionado, registrarAcaoPosCriacao]);

  if (!ehUC) return null;

  const lista = criando ? templatesDaCategoria : templates;
  const options = lista.filter((t) => t.id).map((t) => ({ value: t.id.trim(), label: t.nome }));
  const podeAplicar = !!selecionado && selecionado !== planoOrigemAtual;
  const ocupado = carregando || carregandoCategoria;

  const semCategoria = criando && !categoriaId?.trim();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Plano de Manutenção</label>

      {ocupado ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : semCategoria ? (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Escolha a categoria do equipamento para ver os planos disponíveis.</span>
        </div>
      ) : lista.length === 0 ? (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Nenhum plano disponível para esta <span className="text-foreground">categoria</span>.
          </span>
        </div>
      ) : somenteLeitura ? (
        <div className="p-2 bg-muted/50 rounded border text-sm">
          {planoAtual?.nome || 'Nenhum plano vinculado'}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 min-w-0">
            <Combobox
              options={options}
              value={selecionado || undefined}
              onValueChange={(val) => setSelecionado((val || '').trim())}
              placeholder="Selecione um plano..."
              searchPlaceholder="Buscar plano..."
              emptyText="Nenhum plano encontrado"
              disabled={salvando}
            />
          </div>

          {/* No cadastro não há o que aplicar agora: o vínculo sai junto com o
              equipamento, ao salvar. */}
          {!criando && (
            <>
              <Button
                type="button"
                onClick={() => vincular(selecionado)}
                disabled={!podeAplicar || salvando}
                size="icon"
                title={planoAtual ? 'Substituir plano' : 'Vincular plano'}
                aria-label={planoAtual ? 'Substituir plano' : 'Vincular plano'}
              >
                <Link2 className="h-4 w-4" />
              </Button>

              {planoAtual && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={desvincular}
                  disabled={salvando}
                  size="icon"
                  title="Desvincular plano"
                  aria-label="Desvincular plano"
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {criando && selecionado && (
        <p className="text-xs text-muted-foreground">
          As tarefas deste plano serão copiadas para o equipamento ao salvar.
        </p>
      )}
    </div>
  );
}
