// src/features/programacao-os/components/RecursosDaOrigem.tsx
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { instrucoesApi } from '@/services/instrucoes.services';
import {
  contribuicaoDaInstrucao,
  trocarInstrucoes,
  type RecursosDaProgramacao,
} from '@/features/programacao-os/utils/recursos-das-instrucoes';

interface RecursosDaOrigemProps {
  /** As instruções da programação: as das tarefas e as avulsas */
  instrucaoIds: string[];
  /** A lista ainda está sendo lida da origem: a base só se firma depois */
  carregando: boolean;
  /**
   * No cadastro o planejado começa vazio, e toda instrução que chega soma. Na
   * edição, a primeira lista completa é a base: os recursos gravados já contam
   * com ela
   */
  comecaVazio: boolean;
  /** O planejado do formulário agora */
  recursos: RecursosDaProgramacao;
  /** Ausente (leitura), nada se aplica */
  onRecursos?: (recursos: RecursosDaProgramacao) => void;
  /** Há troca esperando o detalhe das instruções: salvar agora gravaria sem os recursos dela */
  onCalculando?: (calculando: boolean) => void;
}

type Contribuicao = RecursosDaProgramacao | null;

/**
 * Mantém materiais, técnicos, ferramentas e orçamento de acordo com as
 * instruções da programação (SN-86), sem apagar o que o planejador ajustou:
 * a instrução que entra soma o que ela pede, a que sai subtrai
 * (`trocarInstrucoes`). Não renderiza nada: os campos já existem no formulário.
 *
 * Na edição, a primeira lista lida é a base: os recursos gravados já contam com
 * ela, e somar de novo dobraria tudo. Por isso a base espera a origem terminar
 * de ser lida — antes disso a lista está incompleta, e a diferença para a
 * completa seria somada à programação gravada. No cadastro a base é vazia.
 *
 * As trocas vão em fila: duas seguidas (trocar a anomalia duas vezes) não se
 * atropelam, e cada uma parte do que a anterior deixou.
 */
export function RecursosDaOrigem({ instrucaoIds, carregando, comecaVazio, recursos, onRecursos, onCalculando }: RecursosDaOrigemProps) {
  // Chave em texto: o pai recria o array a cada render
  const ids = [...new Set(instrucaoIds.map((i) => String(i).trim()).filter(Boolean))];
  const chave = [...ids].sort().join('|');

  const baseRef = useRef<string[] | null>(comecaVazio ? [] : null);
  const filaRef = useRef<Promise<void>>(Promise.resolve());
  const contribuicoesRef = useRef(new Map<string, Promise<Contribuicao>>());
  // O planejado mais novo: o do formulário, ou o que esta fila acabou de aplicar
  const recursosRef = useRef(recursos);
  recursosRef.current = recursos;
  const onRecursosRef = useRef(onRecursos);
  onRecursosRef.current = onRecursos;
  const onCalculandoRef = useRef(onCalculando);
  onCalculandoRef.current = onCalculando;
  const naFilaRef = useRef(0);
  const montadoRef = useRef(true);
  useEffect(() => () => void (montadoRef.current = false), []);

  useEffect(() => {
    if (carregando) return;
    // A base se firma também na leitura: o sheet abre em "Visualizar" e passa a
    // "Editar" sem remontar, e sem base a primeira troca da edição virava a base,
    // calada, sem somar nem tirar nada
    if (baseRef.current === null) {
      baseRef.current = ids;
      return;
    }
    if (!onRecursosRef.current) return;

    const destino = ids;
    naFilaRef.current += 1;
    if (naFilaRef.current === 1) onCalculandoRef.current?.(true);
    filaRef.current = filaRef.current.then(async () => {
      const antes = baseRef.current ?? [];
      const entraram = destino.filter((id) => !antes.includes(id));
      const sairam = antes.filter((id) => !destino.includes(id));
      if (!entraram.length && !sairam.length) return;

      const contribuicao = (id: string): Promise<Contribuicao> => {
        let pedida = contribuicoesRef.current.get(id);
        if (!pedida) {
          pedida = instrucoesApi
            .findOne(id)
            .then(contribuicaoDaInstrucao)
            // O interceptor já avisou da falha; sem o detalhe, essa instrução não mexe nos recursos
            .catch(() => {
              contribuicoesRef.current.delete(id);
              return null;
            });
          contribuicoesRef.current.set(id, pedida);
        }
        return pedida;
      };
      const lidas = async (lista: string[]) =>
        (await Promise.all(lista.map(contribuicao))).filter((c): c is RecursosDaProgramacao => c !== null);

      const [mais, menos, ficam] = await Promise.all([
        lidas(entraram),
        lidas(sairam),
        lidas(destino.filter((id) => antes.includes(id))),
      ]);
      // Sem aplicar, a base não anda: a troca fica para a próxima vez que der
      if (!montadoRef.current || !onRecursosRef.current) return;

      const novo = trocarInstrucoes(recursosRef.current, { entraram: mais, sairam: menos, ficam });
      recursosRef.current = novo;
      onRecursosRef.current(novo);
      baseRef.current = destino;
    })
      // Uma troca que falha avisa e não para a fila: sem o catch, as seguintes eram puladas caladas
      .catch((erro: unknown) => {
        toast.error('Não foi possível ajustar os recursos das instruções', {
          description: erro instanceof Error ? erro.message : String(erro),
        });
      })
      .finally(() => {
        naFilaRef.current -= 1;
        if (naFilaRef.current === 0 && montadoRef.current) onCalculandoRef.current?.(false);
      });
    // A chave resume a lista
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, carregando]);

  return null;
}
