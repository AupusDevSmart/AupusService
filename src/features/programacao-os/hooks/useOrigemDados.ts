// src/features/programacao-os/hooks/useOrigemDados.ts
import { useCallback, useMemo, useState } from 'react';
import { anomaliasService } from '@/services/anomalias.service';
import { solicitacoesServicoService } from '@/services/solicitacoes-servico.service';
import { planosManutencaoApi, type PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';
import { POR_PAGINA, useBuscaPaginada } from '@/hooks/useBuscaPaginada';
import type { Anomalia } from '@/features/anomalias/types';
import type { SolicitacaoServico } from '@/features/solicitacoes-servico/types';

export interface AnomaliaDisponivel {
  id: string;
  descricao: string;
  local: string;
  ativo: string;
  prioridade: string;
  status: string;
  data: string;
  equipamentoId?: string;
  plantaId?: string;
  unidadeId?: string;
  plantaNome?: string;
  unidadeNome?: string;
  condicao?: string;
  origem?: string;
}

export interface PlanoDisponivel {
  id: string;
  nome: string;
  categoria: string;
  totalTarefas: number;
  plantaId?: string;
  /// Plano de manutencao e sempre de UM equipamento. Sem o nome dele na lista,
  /// dois planos parecidos ficam indistinguiveis e a OS sai para o ativo errado.
  equipamentoId?: string;
  equipamentoNome?: string;
  plantaNome?: string;
  unidadeNome?: string;
}

export interface SolicitacaoDisponivel {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: string;
  status: string;
  local: string;
  plantaId?: string;
  unidadeId?: string;
  plantaNome?: string;
  unidadeNome?: string;
  equipamentoId?: string;
  solicitanteNome: string;
  dataSolicitacao: string;
}

function paraAnomaliaDisponivel(anomalia: Anomalia): AnomaliaDisponivel {
  return {
    id: String(anomalia.id).trim(),
    descricao: anomalia.descricao,
    local: anomalia.local,
    ativo: anomalia.ativo,
    prioridade: anomalia.prioridade,
    status: anomalia.status,
    data: anomalia.created_at || anomalia.data || new Date().toISOString(),
    equipamentoId: anomalia.equipamento_id?.toString() || anomalia.equipamentoId?.toString(),
    plantaId: anomalia.planta_id?.toString() || anomalia.plantaId?.toString(),
    unidadeId: anomalia.unidade_id?.toString() || anomalia.unidadeId?.toString(),
    plantaNome: anomalia.planta?.nome || anomalia.equipamento?.planta?.nome,
    unidadeNome: anomalia.unidade?.nome || anomalia.equipamento?.unidade?.nome,
    condicao: anomalia.condicao,
    origem: anomalia.origem,
  };
}

function paraSolicitacaoDisponivel(solicitacao: SolicitacaoServico): SolicitacaoDisponivel {
  return {
    id: String(solicitacao.id).trim(),
    numero: solicitacao.numero,
    titulo: solicitacao.titulo,
    descricao: solicitacao.descricao,
    tipo: solicitacao.tipo,
    prioridade: solicitacao.prioridade,
    status: solicitacao.status,
    local: solicitacao.local || '',
    plantaId: solicitacao.planta_id,
    unidadeId: solicitacao.unidade_id,
    plantaNome: solicitacao.planta?.nome,
    unidadeNome: solicitacao.unidade?.nome,
    equipamentoId: solicitacao.equipamento_id,
    solicitanteNome: solicitacao.solicitante_nome,
    dataSolicitacao: solicitacao.data_solicitacao || solicitacao.created_at || '',
  };
}

function paraPlanoDisponivel(plano: PlanoManutencaoApiResponse): PlanoDisponivel {
  return {
    id: String(plano.id).trim(),
    nome: plano.nome,
    categoria: plano.equipamento?.tipo_equipamento || 'GERAL',
    totalTarefas: plano.total_tarefas || plano.tarefas?.length || 0,
    plantaId: plano.equipamento?.unidade?.planta?.id || plano.equipamento?.planta?.id,
    equipamentoId: plano.equipamento?.id,
    equipamentoNome: plano.equipamento?.nome,
    plantaNome: plano.equipamento?.unidade?.planta?.nome || plano.equipamento?.planta?.nome,
    unidadeNome: plano.equipamento?.unidade?.nome,
  };
}

/** Há mais páginas? A anomalia e a solicitação contam `totalPages`; o plano, `pages`. */
const temMais = (pagina: number, total?: number) => pagina < (total ?? 0);

export type TipoDeOrigemResolvivel = 'ANOMALIA' | 'SOLICITACAO_SERVICO' | 'PLANO_MANUTENCAO';

/** A origem pedida pelo atalho, ou o motivo de não poder usá-la */
export type OrigemResolvida =
  | { item: AnomaliaDisponivel | SolicitacaoDisponivel | PlanoDisponivel }
  | { motivo: string };

const somar = <T extends { id: string }>(lista: T[], item: T): T[] => [item, ...lista.filter((i) => i.id !== item.id)];

/** O escolhido fica na lista mesmo que a busca ou a página o tire de vista. */
function comOsEscolhidos<T extends { id: string }>(escolhidos: T[], itens: T[]): T[] {
  const ids = new Set(itens.map((i) => i.id));
  return [...escolhidos.filter((e) => !ids.has(e.id)), ...itens];
}

/**
 * As origens programáveis (SN-77): anomalias e solicitações REGISTRADAS e os
 * planos vinculados a um equipamento. Todas, por rolagem infinita e busca no
 * servidor — eram 100 de cada, filtradas no navegador, e a 101ª não aparecia.
 * Só a lista do tipo escolhido busca.
 */
export const useOrigemDados = (tipoAtivo?: TipoDeOrigemResolvivel | string) => {
  const anomalias = useBuscaPaginada<AnomaliaDisponivel>({
    chave: ['origem-da-os', 'anomalias'],
    ativa: tipoAtivo === 'ANOMALIA',
    buscarPagina: async (page, search) => {
      const resposta = await anomaliasService.findAll({ page, limit: POR_PAGINA, search, status: 'REGISTRADA' });
      return {
        // O filtro é do servidor; o daqui é defesa
        itens: resposta.data.filter((a) => a.status === 'REGISTRADA').map(paraAnomaliaDisponivel),
        temMais: temMais(page, resposta.pagination?.totalPages),
      };
    },
  });

  const solicitacoes = useBuscaPaginada<SolicitacaoDisponivel>({
    chave: ['origem-da-os', 'solicitacoes'],
    ativa: tipoAtivo === 'SOLICITACAO_SERVICO',
    buscarPagina: async (page, search) => {
      const resposta = await solicitacoesServicoService.findAll({ page, limit: POR_PAGINA, search, status: 'REGISTRADA' });
      return { itens: resposta.data.map(paraSolicitacaoDisponivel), temMais: temMais(page, resposta.pagination?.totalPages) };
    },
  });

  const planos = useBuscaPaginada<PlanoDisponivel>({
    chave: ['origem-da-os', 'planos'],
    ativa: tipoAtivo === 'PLANO_MANUTENCAO',
    buscarPagina: async (page, search) => {
      // Os planos ligados a um equipamento, e nao os templates: a OS e sempre
      // para um ativo, e o template nao tem nenhum
      const resposta = await planosManutencaoApi.findAll({ page, limit: POR_PAGINA, search: search || undefined, vinculados: true, sort_by: 'nome', sort_order: 'asc' });
      return { itens: resposta.data.map(paraPlanoDisponivel), temMais: temMais(page, resposta.pagination?.pages) };
    },
  });

  // A origem que o atalho abriu ou que a pessoa escolheu, para não sumir do resumo
  const [anomaliasEscolhidas, setAnomaliasEscolhidas] = useState<AnomaliaDisponivel[]>([]);
  const [solicitacoesEscolhidas, setSolicitacoesEscolhidas] = useState<SolicitacaoDisponivel[]>([]);
  const [planosEscolhidos, setPlanosEscolhidos] = useState<PlanoDisponivel[]>([]);

  const guardar = useCallback((tipo: TipoDeOrigemResolvivel, item: AnomaliaDisponivel | SolicitacaoDisponivel | PlanoDisponivel) => {
    if (tipo === 'ANOMALIA') setAnomaliasEscolhidas((lista) => somar(lista, item as AnomaliaDisponivel));
    else if (tipo === 'SOLICITACAO_SERVICO') setSolicitacoesEscolhidas((lista) => somar(lista, item as SolicitacaoDisponivel));
    else setPlanosEscolhidos((lista) => somar(lista, item as PlanoDisponivel));
  }, []);

  /**
   * A origem que o atalho pediu (`?origem=&id=`), pronta para ser escolhida:
   * buscada pelo id — não precisa estar nas páginas carregadas — e só se ainda
   * puder ser programada. Senão devolve o motivo, que o seletor mostra em vez de
   * abrir vazio sem dizer por quê.
   */
  const resolverOrigem = useCallback(
    async (tipo: TipoDeOrigemResolvivel, id: string): Promise<OrigemResolvida> => {
      const alvo = id.trim();

      if (tipo === 'ANOMALIA') {
        const anomalia = await anomaliasService.findOne(alvo).catch(() => null);
        if (!anomalia) return { motivo: 'A anomalia não foi encontrada ou está fora do seu escopo.' };
        if (anomalia.status !== 'REGISTRADA') {
          return { motivo: `A anomalia está ${String(anomalia.status).toLowerCase()} e não pode ser programada agora.` };
        }
        const item = paraAnomaliaDisponivel(anomalia);
        guardar(tipo, item);
        return { item };
      }

      if (tipo === 'SOLICITACAO_SERVICO') {
        const solicitacao = await solicitacoesServicoService.findOne(alvo).catch(() => null);
        if (!solicitacao) return { motivo: 'A solicitação não foi encontrada ou está fora do seu escopo.' };
        if (solicitacao.status !== 'REGISTRADA') {
          return { motivo: `A solicitação está ${String(solicitacao.status).toLowerCase()} e não pode ser programada agora.` };
        }
        const item = paraSolicitacaoDisponivel(solicitacao);
        guardar(tipo, item);
        return { item };
      }

      const plano = await planosManutencaoApi.findOne(alvo).catch(() => null);
      if (!plano?.equipamento_id) {
        return { motivo: 'O plano não está entre os planos vinculados a equipamentos que você pode programar.' };
      }
      const item = paraPlanoDisponivel(plano);
      guardar(tipo, item);
      return { item };
    },
    [guardar],
  );

  // As tarefas ativas do plano escolhido
  const gerarTarefasDoPlano = useCallback(async (planoId: string) => {
    const { tarefasApi } = await import('@/services/tarefas.services');
    const tarefasDoPlano = await tarefasApi.findByPlano(planoId, { status: 'ATIVA', limit: 100, page: 1 });
    return tarefasDoPlano.map((tarefa) => ({
      id: tarefa.id,
      templateId: tarefa.id,
      tag: tarefa.tag,
      nome: tarefa.nome,
      frequencia: tarefa.frequencia,
      criticidade: tarefa.criticidade,
      ordem: tarefa.ordem,
      // Conteudo do que sera feito: desde o PR6 vive na instrucao, nao na
      // tarefa. E daqui que as telas de OS leem categoria, tipo e etapas.
      instrucao: tarefa.instrucao,
    }));
  }, []);

  const anomaliasDisponiveis = useMemo(() => comOsEscolhidos(anomaliasEscolhidas, anomalias.itens), [anomaliasEscolhidas, anomalias.itens]);
  const solicitacoesDisponiveis = useMemo(() => comOsEscolhidos(solicitacoesEscolhidas, solicitacoes.itens), [solicitacoesEscolhidas, solicitacoes.itens]);
  const planosDisponiveis = useMemo(() => comOsEscolhidos(planosEscolhidos, planos.itens), [planosEscolhidos, planos.itens]);

  return {
    anomalias: { itens: anomaliasDisponiveis, paginacao: anomalias.paginacao, carregando: anomalias.carregando, erro: anomalias.erro },
    solicitacoes: { itens: solicitacoesDisponiveis, paginacao: solicitacoes.paginacao, carregando: solicitacoes.carregando, erro: solicitacoes.erro },
    planos: { itens: planosDisponiveis, paginacao: planos.paginacao, carregando: planos.carregando, erro: planos.erro },
    guardar,
    resolverOrigem,
    gerarTarefasDoPlano,
  };
};
