// src/features/programacao-os/components/InstrucoesDaProgramacao.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/core';
import { InstrucaoExpandableCard } from '@/components/common/InstrucaoExpandableCard';
import { instrucoesApi, opcaoDaInstrucao } from '@/services/instrucoes.services';
import { formatApiError } from '@/utils/api-error';
import { distintas, useInstrucoesDaOrigem, type InstrucaoResumida, type OrigemDasInstrucoes } from './InstrucoesDaOrigem';
import { RecursosDaOrigem } from './RecursosDaOrigem';
import type { RecursosDaProgramacao } from '@/features/programacao-os/utils/recursos-das-instrucoes';

interface InstrucoesDaProgramacaoProps extends OrigemDasInstrucoes {
  /** As instruções avulsas do formulário (`instrucoes_ids`); indefinido até a origem ser lida */
  valor?: string[];
  /** Ausente, só leitura. Indefinido deixa o servidor ler as da origem */
  onValor?: (ids: string[] | undefined) => void;
  /** No cadastro, a lista nasce das instruções da origem; na edição vale a gravada */
  semearDaOrigem: boolean;
  /** As gravadas na programação, com código e nome (edição e leitura) */
  gravadas?: InstrucaoResumida[];
  /** O planejado do formulário e quem o troca; ausente, as instruções não mexem nele */
  recursos: RecursosDaProgramacao;
  onRecursos?: (recursos: RecursosDaProgramacao) => void;
  /** Os recursos de uma troca ainda estão sendo calculados (o salvar espera) */
  onCalculando?: (calculando: boolean) => void;
}

const aparadas = (ids: unknown): string[] =>
  Array.isArray(ids) ? [...new Set(ids.map((id) => String(id ?? '').trim()).filter(Boolean))] : [];

/**
 * As instruções da programação (SN-86): as que vêm pelas tarefas, que saem com
 * a tarefa, e as avulsas, que o planejador acrescenta ou tira. No cadastro, as
 * avulsas nascem das da anomalia ou da solicitação; trocar a origem recomeça a
 * lista. É delas que a OS tira o checklist e os recursos planejados.
 */
export function InstrucoesDaProgramacao({
  valor,
  onValor,
  semearDaOrigem,
  gravadas,
  recursos,
  onRecursos,
  onCalculando,
  ...origem
}: InstrucoesDaProgramacaoProps) {
  const { pelasTarefas, daOrigem, semeaduraLida, falhou, carregando } = useInstrucoesDaOrigem(origem);
  const editavel = Boolean(onValor);

  // No cadastro, cada anomalia ou solicitação lida semeia a lista uma vez (marcar
  // uma tarefa do plano não ressemeia). Espera o formulário estar editável: o
  // BaseForm desliga os campos enquanto a página carrega
  const semeadaRef = useRef<string | null>(null);
  useEffect(() => {
    if (!semearDaOrigem || !onValor || carregando || semeaduraLida === null || semeadaRef.current === semeaduraLida) return;
    semeadaRef.current = semeaduraLida;
    // A origem que não se leu não vira lista vazia (nem fica a da origem anterior):
    // sem a lista, o servidor põe as da origem
    onValor(falhou ? undefined : daOrigem.map((i) => i.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semearDaOrigem, carregando, semeaduraLida, editavel]);

  // No cadastro, a origem que não se leu não deixa mexer na lista: acrescentar
  // trocaria, calado, as da origem (que o servidor põe sem a lista) pela acrescentada
  const listaTravada = semearDaOrigem && falhou && valor === undefined;

  const [catalogo, setCatalogo] = useState<InstrucaoResumida[] | null>(null);
  const [acrescentando, setAcrescentando] = useState(false);
  const [lendoCatalogo, setLendoCatalogo] = useState(false);

  const abrirCatalogo = () => {
    setAcrescentando(true);
    if (catalogo || lendoCatalogo) return;
    setLendoCatalogo(true);
    // Todas as ativas (paginado por dentro): uma página só escondia a 101ª
    instrucoesApi
      .listarTodasAtivas()
      .then((lista) => setCatalogo(lista.filter((i) => i.id && i.nome).map((i) => ({ id: i.id.trim(), codigo: i.codigo, nome: i.nome }))))
      .catch((erro) => {
        // Sem aviso, a lista vazia se leria como "não há instruções cadastradas"
        toast.error('Erro ao carregar as instruções', { description: formatApiError(erro) });
        setAcrescentando(false);
      })
      .finally(() => setLendoCatalogo(false));
  };

  const idsDasTarefas = useMemo(() => new Set(pelasTarefas.map((i) => i.id)), [pelasTarefas]);
  // A que já vem por tarefa não se repete: o servidor também a pula
  const avulsas = aparadas(valor).filter((id) => !idsDasTarefas.has(id));

  const rotulos = useMemo(() => {
    const mapa = new Map<string, InstrucaoResumida>();
    // As das tarefas também: sem elas, o cartão saía só com "Instrucao"
    for (const i of distintas([...(catalogo ?? []), ...pelasTarefas, ...daOrigem, ...(gravadas ?? [])])) mapa.set(i.id, i);
    return mapa;
  }, [catalogo, pelasTarefas, daOrigem, gravadas]);

  const opcoes = (catalogo ?? [])
    .filter((i) => !idsDasTarefas.has(i.id) && !avulsas.includes(i.id))
    .map((i) => opcaoDaInstrucao({ id: i.id, codigo: i.codigo, nome: i.nome ?? '' }));

  const acrescentar = (id: string) => {
    setAcrescentando(false);
    if (id && !avulsas.includes(id.trim())) onValor?.([...avulsas, id.trim()]);
  };
  const tirar = (id: string) => onValor?.(avulsas.filter((a) => a !== id));

  const todas = [...pelasTarefas.map((i) => i.id), ...avulsas];
  const recursosAplicados = (
    <RecursosDaOrigem
      instrucaoIds={todas}
      // No cadastro, espera a semeadura da origem lida: a lista de antes dela é a da origem anterior
      carregando={carregando || (semearDaOrigem && editavel && semeadaRef.current !== semeaduraLida)}
      comecaVazio={semearDaOrigem}
      recursos={recursos}
      onRecursos={editavel ? onRecursos : undefined}
      onCalculando={onCalculando}
    />
  );

  // Leitura sem instrução: não ocupa espaço
  if (!editavel && !carregando && todas.length === 0) return recursosAplicados;

  const cartao = (id: string, removivel: boolean) => {
    const rotulo = rotulos.get(id);
    return (
      <InstrucaoExpandableCard
        key={id}
        id={id}
        codigo={rotulo?.codigo}
        nome={rotulo?.nome}
        disabled={!removivel}
        onRemove={removivel ? () => tirar(id) : undefined}
      />
    );
  };

  return (
    <div className="space-y-2">
      {recursosAplicados}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Instruções</span>
        {editavel && !listaTravada && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={abrirCatalogo}
            title="Acrescentar instrução"
            aria-label="Acrescentar instrução"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {acrescentando && editavel && (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            {lendoCatalogo ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Carregando as instruções...
              </div>
            ) : (
              <Combobox
                options={opcoes}
                value={undefined}
                onValueChange={(id) => (id ? acrescentar(id) : setAcrescentando(false))}
                placeholder="Buscar instrução..."
                searchPlaceholder="Digite para buscar..."
                emptyText="Nenhuma instrução disponível"
              />
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setAcrescentando(false)}
            title="Cancelar"
            aria-label="Cancelar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {carregando ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando...
        </div>
      ) : listaTravada ? (
        <p className="text-sm text-muted-foreground">
          Não foi possível ler as instruções da origem. Ao salvar, a programação recebe as que a origem tiver; os
          recursos delas não foram planejados aqui.
        </p>
      ) : todas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma instrução. O checklist da OS sai dos passos delas.</p>
      ) : (
        <div className="space-y-3">
          {pelasTarefas.length > 0 && (
            <div className="space-y-1">
              {avulsas.length > 0 && <p className="text-xs text-muted-foreground">Pelas tarefas</p>}
              {pelasTarefas.map((i) => cartao(i.id, false))}
            </div>
          )}
          {avulsas.length > 0 && (
            <div className="space-y-1">
              {pelasTarefas.length > 0 && <p className="text-xs text-muted-foreground">Acrescentadas</p>}
              {avulsas.map((id) => cartao(id, editavel))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
