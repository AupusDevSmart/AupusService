// src/features/programacao-os/components/RecursosDaOrigem.tsx
import { useEffect, useRef } from 'react';
import type { MaterialItem } from '@/components/common/cards/MateriaisCardManager';
import type { FerramentaItem } from '@/components/common/cards/FerramentasCardManager';
import type { TecnicoItem } from '@/components/common/cards/TecnicosCardManager';

/** O que a instrução declara precisar. */
export interface RecursoDaInstrucao {
  tipo?: string;
  descricao?: string;
  quantidade?: number | string | null;
  unidade?: string | null;
}

export interface RecursosSeparados {
  materiais: MaterialItem[];
  ferramentas: FerramentaItem[];
  tecnicos: TecnicoItem[];
}

const vazio = (): RecursosSeparados => ({ materiais: [], ferramentas: [], tecnicos: [] });

/**
 * Reparte os recursos das instruções nos três campos da programação.
 *
 * O `TipoRecurso` da instrução tem cinco valores e a programação tem três
 * campos, então o mapa não é um-para-um:
 *
 *   MATERIAL                -> materiais
 *   FERRAMENTA, INSTRUMENTO -> ferramentas
 *   TECNICO                 -> tecnicos
 *   VIATURA                 -> nenhum: veículo se resolve pela reserva, que tem
 *                              período e disponibilidade próprios
 *
 * O técnico da instrução descreve um PERFIL ("Eletricista"), não uma pessoa —
 * por isso vai para `especialidade` e deixa `nome` vazio, para ser preenchido
 * quando alguém for escalado.
 *
 * A mesma ferramenta pedida por duas instruções vira uma linha só, com as
 * quantidades somadas: são o mesmo recurso na mesma OS.
 */
export function separarRecursos(recursos: RecursoDaInstrucao[]): RecursosSeparados {
  const saida = vazio();

  const numero = (valor: unknown) => {
    const n = Number(valor ?? 0);
    return Number.isFinite(n) && n > 0 ? n : 1;
  };

  for (const recurso of recursos) {
    const descricao = (recurso.descricao ?? '').trim();
    if (!descricao) continue;

    const tipo = (recurso.tipo ?? '').toUpperCase();
    const quantidade = numero(recurso.quantidade);
    const unidade = recurso.unidade?.trim() || '';

    if (tipo === 'MATERIAL') {
      const existente = saida.materiais.find(
        (m) => m.descricao === descricao && m.unidade === unidade,
      );
      if (existente) existente.quantidade_planejada += quantidade;
      else saida.materiais.push({ descricao, quantidade_planejada: quantidade, unidade });
      continue;
    }

    if (tipo === 'FERRAMENTA' || tipo === 'INSTRUMENTO') {
      const existente = saida.ferramentas.find((f) => f.descricao === descricao);
      if (existente) existente.quantidade += quantidade;
      else saida.ferramentas.push({ descricao, quantidade, unidade: unidade || undefined });
      continue;
    }

    if (tipo === 'TECNICO') {
      const existente = saida.tecnicos.find((t) => t.especialidade === descricao);
      // A quantidade do técnico é tempo: a instrução guarda em horas.
      if (existente) existente.horas_estimadas += quantidade;
      else saida.tecnicos.push({ nome: '', especialidade: descricao, horas_estimadas: quantidade });
      continue;
    }

    // VIATURA e qualquer tipo novo caem aqui e são ignorados de propósito.
  }

  return saida;
}

interface RecursosDaOrigemProps {
  /** Os ids das instruções da origem. Mudou o conjunto, refaz os recursos. */
  instrucaoIds: string[];
  /** Some quando não há origem — aí não há o que herdar. */
  ativo: boolean;
  onCarregar: (recursos: RecursosSeparados) => void;
}

/**
 * Preenche materiais, ferramentas e técnicos a partir das instruções da origem.
 *
 * Não renderiza nada: os três campos já existem no formulário, e o que faltava
 * era alguém preenchê-los. Quem quiser ajustar ou acrescentar continua fazendo
 * isso nos próprios campos.
 *
 * Trocar a origem APAGA e recarrega. É perda deliberada: manter o que estava
 * misturaria os recursos de duas origens diferentes na mesma OS, e ninguém
 * conseguiria depois dizer de onde veio cada linha.
 */
export function RecursosDaOrigem({ instrucaoIds, ativo, onCarregar }: RecursosDaOrigemProps) {
  // Chave em texto: o pai recria o array a cada render, e comparar por
  // referência dispararia a carga sem parar.
  const chave = [...instrucaoIds].map((i) => String(i).trim()).filter(Boolean).sort().join('|');
  const anteriorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ativo) return;

    // Primeira passagem numa OS já salva: os recursos gravados são os que
    // valem, e recarregar apagaria o que já foi ajustado.
    if (anteriorRef.current === null) {
      anteriorRef.current = chave;
      return;
    }

    if (anteriorRef.current === chave) return;
    anteriorRef.current = chave;

    if (!chave) {
      onCarregar(vazio());
      return;
    }

    let cancelado = false;

    void (async () => {
      const { instrucoesApi } = await import('@/services/instrucoes.services');

      const detalhes = await Promise.all(
        chave.split('|').map((id) => instrucoesApi.findOne(id).catch(() => null)),
      );

      if (cancelado) return;

      const recursos = detalhes
        .filter(Boolean)
        .flatMap((instrucao) => (instrucao!.recursos ?? []) as RecursoDaInstrucao[]);

      onCarregar(separarRecursos(recursos));
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, ativo]);

  return null;
}
