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

/** A linha de recurso como a instrução a devolve (SN-85): o item embutido e o uso */
interface LinhaDaInstrucao {
  recurso?: { categoria?: string; nome?: string; unidade?: string | null } | null;
  quantidade?: number | string | null;
  duracao_horas?: number | string | null;
  fator_perda?: number | string | null;
}

/**
 * A linha da instrução no formato que a programação reparte. A quantidade é a
 * que a OS planeja: o material com a perda (é o que se compra), a mão de obra
 * em horas de equipe (pessoas × horas de cada uma), o instrumento pela
 * quantidade.
 */
export function daLinhaDaInstrucao(linha: LinhaDaInstrucao): RecursoDaInstrucao {
  const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const quantidade = n(linha.quantidade ?? 1) || 1;
  const tipo = linha.recurso?.categoria;
  const planejada =
    tipo === 'MATERIAL'
      ? Math.round(quantidade * (1 + n(linha.fator_perda)) * 10_000) / 10_000
      : tipo === 'MAO_DE_OBRA'
        ? // Sem duração, as horas ficam vazias (0) para a programação preencher: inventá-las da quantidade diria "2 h" de 2 pessoas
          Math.round(quantidade * n(linha.duracao_horas) * 100) / 100
        : quantidade;
  return { tipo, descricao: linha.recurso?.nome, quantidade: planejada, unidade: linha.recurso?.unidade ?? null };
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
 * As 6 categorias do recurso (SN-83) e os três campos da programação, então o
 * mapa não é um-para-um:
 *
 *   MATERIAL                -> materiais
 *   INSTRUMENTO             -> ferramentas
 *   MAO_DE_OBRA             -> tecnicos
 *   VEICULO                 -> nenhum: veículo se resolve pela reserva, que tem
 *                              período e disponibilidade próprios
 *   TERCEIRO, DESPESA_CAMPO -> nenhum aqui (vão para o orçamento, SN-86)
 *   o MAQUINÁRIO da instrução -> nenhum aqui, por ora: a programação não tem
 *                              campo de máquina; entra com o planejado do SN-86
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

    if (tipo === 'INSTRUMENTO') {
      const existente = saida.ferramentas.find((f) => f.descricao === descricao);
      if (existente) existente.quantidade += quantidade;
      else saida.ferramentas.push({ descricao, quantidade, unidade: unidade || undefined });
      continue;
    }

    if (tipo === 'MAO_DE_OBRA') {
      const existente = saida.tecnicos.find((t) => t.especialidade === descricao);
      // A quantidade do técnico é tempo, em horas de equipe. Sem horas, fica 0: a programação preenche
      const horas = Number.isFinite(Number(recurso.quantidade)) && Number(recurso.quantidade) > 0 ? Number(recurso.quantidade) : 0;
      if (existente) existente.horas_estimadas += horas;
      else saida.tecnicos.push({ nome: '', especialidade: descricao, horas_estimadas: horas });
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
        .flatMap((instrucao) => (instrucao!.recursos ?? []).map(daLinhaDaInstrucao));

      onCarregar(separarRecursos(recursos));
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, ativo]);

  return null;
}
