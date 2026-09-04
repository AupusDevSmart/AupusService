import { useMemo, useState } from 'react';
import { Share2, Unlink } from 'lucide-react';
import { AlvoDoCompartilhamento, DialogoCompartilhar } from './DialogoCompartilhar';
import { OUTRO_PRODUTO, RecursoSincronizavel, useSincronizacao } from './useSincronizacao';

interface Opcoes {
  recurso: RecursoSincronizavel;
  /** As linhas da pagina atual. So os ids importam. */
  registros: Array<{ id?: string | null } & Record<string, any>>;
  /** De onde tirar o nome legivel do registro, para a confirmacao. */
  nomeDe?: (registro: any) => string;
  /** Some com as acoes para quem nao pode compartilhar. */
  habilitado?: boolean;
}

/**
 * A fiacao de compartilhamento de uma tela de listagem, num lugar so.
 *
 * As quatro telas (usuarios, plantas, instalacoes, equipamentos) precisam
 * exatamente da mesma coisa: estado em lote, duas acoes de linha e um dialogo.
 * Repetir isso quatro vezes garante que a quinta fique diferente — e foi assim
 * que a lista de campos do lote de UAR apodreceu.
 *
 * Devolve `acoes` no formato que o `BaseTable` espera e o `dialogo` ja montado,
 * que a pagina renderiza UMA vez fora da tabela.
 */
export function useAcoesDeCompartilhamento({
  recurso, registros, nomeDe, habilitado = true,
}: Opcoes) {
  const ids = useMemo(
    () => registros.map(r => r?.id).filter(Boolean) as string[],
    [registros],
  );

  const sinc = useSincronizacao(recurso, ids);
  const [alvo, setAlvo] = useState<AlvoDoCompartilhamento | null>(null);

  const nome = (r: any) => nomeDe?.(r) ?? r?.nome ?? r?.id?.trim?.() ?? 'este registro';
  const estadoDe = (r: any) => sinc.estados[r?.id?.trim?.()];

  /**
   * DUAS acoes com `condition`, e nao uma com rotulo dinamico: o tipo
   * `TableAction.label` e `string`, e `icon` como funcao seria confundido com
   * componente React pelo renderizador do BaseTable. Mudar o tipo compartilhado
   * afetaria todas as tabelas do sistema.
   */
  const acoes = habilitado
    ? [
        {
          key: 'compartilhar',
          label: `Compartilhar com o ${OUTRO_PRODUTO}`,
          icon: <Share2 className="h-4 w-4" />,
          condition: (r: any) => !estadoDe(r)?.compartilhado,
          handler: (r: any) => setAlvo({ id: r?.id, nome: nome(r), acao: 'ligar' }),
        },
        {
          key: 'parar_compartilhar',
          label: 'Parar de compartilhar',
          icon: <Unlink className="h-4 w-4" />,
          condition: (r: any) => !!estadoDe(r)?.compartilhado,
          handler: (r: any) => setAlvo({ id: r?.id, nome: nome(r), acao: 'desligar' }),
        },
      ]
    : [];

  const dialogo = (
    <DialogoCompartilhar
      alvo={alvo}
      onFechar={() => setAlvo(null)}
      onPrevia={sinc.buscarPrevia}
      onCompartilhar={sinc.compartilhar}
      onParar={sinc.pararDeCompartilhar}
    />
  );

  /**
   * Abre a confirmacao para um registro qualquer.
   *
   * Existe para as listas que NAO usam `customActions` do BaseTable — a linha
   * expandida de instalacoes desenha os proprios botoes, entao precisa de um
   * jeito de disparar o mesmo dialogo.
   */
  const abrir = (registro: any, acao: 'ligar' | 'desligar') =>
    setAlvo({ id: registro?.id, nome: nome(registro), acao });

  return { acoes, dialogo, abrir, estados: sinc.estados, recarregar: sinc.recarregar };
}
