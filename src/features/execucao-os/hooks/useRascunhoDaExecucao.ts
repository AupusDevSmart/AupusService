// src/features/execucao-os/hooks/useRascunhoDaExecucao.ts
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { ItemOrcamento } from '@/features/programacao-os/types';
import { linhasIniciais, type LinhaDeHoras, type TecnicoDaOS } from '../utils/horas-da-equipe';
import { linhasDosOutrosCustos, type LinhaDeOutroCusto } from '../utils/outros-custos';

/** O que o rascunho lê da OS */
export interface OSDoRascunho {
  id: string;
  tecnicos?: TecnicoDaOS[];
  itens_orcamento?: ItemOrcamento[];
}

export interface RascunhoDaExecucao {
  horas: LinhaDeHoras[];
  setHoras: Dispatch<SetStateAction<LinhaDeHoras[]>>;
  /** null: a OS veio sem a lista do orçamento, e não há o que conferir (mandar apagaria os não previstos) */
  outros: LinhaDeOutroCusto[] | null;
  setOutros: Dispatch<SetStateAction<LinhaDeOutroCusto[]>>;
  /** Algo digitado e não gravado: fechar o sheet pergunta antes de descartar */
  alterado: boolean;
}

const horasDe = (os: OSDoRascunho) => linhasIniciais(os.tecnicos, null);
const outrosDe = (os: OSDoRascunho) => (os.itens_orcamento ? linhasDosOutrosCustos(os.itens_orcamento) : null);

/**
 * As horas da equipe e os outros custos da OS em andamento, digitados ao lado
 * do previsto (seções Equipe e Outros custos, 07/nov/2026) e gravados ao
 * concluir a execução, que os manda no Executar.
 *
 * As horas começam vazias (SN-61: o HH não sai da estimativa calado; a seção
 * oferece "usar as previstas" e "usar o tempo efetivo"). Os outros custos
 * começam no previsto, para conferir (SN-93). Recomeça com outra OS.
 */
export function useRascunhoDaExecucao(os: OSDoRascunho): RascunhoDaExecucao {
  const [horas, setHoras] = useState<LinhaDeHoras[]>(() => horasDe(os));
  const [outros, setOutrosLinhas] = useState<LinhaDeOutroCusto[] | null>(() => outrosDe(os));
  const inicial = useRef(JSON.stringify([horasDe(os), outrosDe(os)]));

  useEffect(() => {
    const h = horasDe(os);
    const o = outrosDe(os);
    setHoras(h);
    setOutrosLinhas(o);
    inicial.current = JSON.stringify([h, o]);
    // Outra OS: o rascunho é dela. A mesma OS relida não apaga o que foi digitado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [os.id]);

  const setOutros: Dispatch<SetStateAction<LinhaDeOutroCusto[]>> = (mudanca) =>
    setOutrosLinhas((atual) => (atual === null ? null : typeof mudanca === 'function' ? mudanca(atual) : mudanca));

  return { horas, setHoras, outros, setOutros, alterado: JSON.stringify([horas, outros]) !== inicial.current };
}
