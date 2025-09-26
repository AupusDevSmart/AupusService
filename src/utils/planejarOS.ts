// src/utils/planejarOS.ts
import { NavigateFunction } from 'react-router-dom';

interface Anomalia {
  id: string;
  descricao: string;
  local: string;
  ativo: string;
  prioridade: string;
  equipamentoId?: string;
  plantaId?: string;
}

interface TarefaTemplate {
  id: string;
  tagBase: string;
  descricao: string;
  categoria: string;
  tipoManutencao: string;
  frequencia: string;
  criticidade: string;
  duracaoEstimada: number;
  tempoEstimado: number;
  responsavelSugerido?: string;
  observacoesTemplate?: string;
}

interface PlanoManutencao {
  id: string;
  nome: string;
  categoria: string;
  tarefasTemplate: TarefaTemplate[];
}

interface Tarefa {
  id: string;
  tag: string;
  descricao: string;
  categoria: string;
  tipoManutencao: string;
  criticidade: string;
  duracaoEstimada: number;
  tempoEstimado: number;
  responsavel?: string;
  equipamentoId?: number;
  plantaId?: number;
}

export interface DadosPreselcionados {
  origem?: {
    tipo: 'ANOMALIA' | 'PLANO_MANUTENCAO' | 'TAREFA';
    item: any;
    dados: any;
  };
  descricao?: string;
  tipo?: string;
  prioridade?: string;
  tempoEstimado?: number;
  duracaoEstimada?: number;
  responsavel?: string;
  observacoes?: string;
}

/**
 * Planejar OS a partir de uma Anomalia
 */
export const planejarOSComAnomalia = (
  anomalia: Anomalia, 
  navigate: NavigateFunction
) => {
  console.log('🚨 Planejando OS para anomalia:', anomalia.id);

  const dadosPreselcionados: DadosPreselcionados = {
    origem: {
      tipo: 'ANOMALIA',
      item: anomalia,
      dados: {
        anomaliaId: anomalia.id,
        descricaoOrigem: anomalia.descricao,
        localOrigem: anomalia.local,
        ativoOrigem: anomalia.ativo,
        equipamentoId: anomalia.equipamentoId,
        plantaId: anomalia.plantaId,
        prioridadeOrigem: anomalia.prioridade
      }
    },
    descricao: `Correção: ${anomalia.descricao}`,
    tipo: 'CORRETIVA', // Anomalias geralmente geram manutenção corretiva
    prioridade: anomalia.prioridade,
    tempoEstimado: anomalia.prioridade === 'CRITICA' ? 2 : 4,
    duracaoEstimada: anomalia.prioridade === 'CRITICA' ? 3 : 6,
    observacoes: `Gerada a partir da anomalia ${anomalia.id}: ${anomalia.descricao}`
  };

  navigate('/programacao-os', {
    state: {
      preselectedData: dadosPreselcionados
    }
  });
};

/**
 * Planejar OS a partir de um Plano de Manutenção (com tarefas e equipamentos selecionados)
 */
export const planejarOSComPlano = (
  plano: PlanoManutencao,
  tarefasSelecionadas: TarefaTemplate[],
  equipamentosSelecionados: number[],
  navigate: NavigateFunction
) => {
  console.log('📋 Planejando OS para plano:', plano.id);
  console.log('✅ Tarefas selecionadas:', tarefasSelecionadas.length);
  console.log('🔧 Equipamentos selecionados:', equipamentosSelecionados.length);

  const totalDuracao = tarefasSelecionadas.reduce((acc, t) => acc + t.duracaoEstimada, 0);
  const totalTempo = tarefasSelecionadas.reduce((acc, t) => acc + t.tempoEstimado, 0) / 60; // converter minutos para horas

  const dadosPreselcionados: DadosPreselcionados = {
    origem: {
      tipo: 'PLANO_MANUTENCAO',
      item: plano,
      dados: {
        planoId: plano.id,
        planoNome: plano.nome,
        categoria: plano.categoria,
        tarefasSelecionadas,
        equipamentosSelecionados,
        totalTarefas: tarefasSelecionadas.length,
        totalEquipamentos: equipamentosSelecionados.length
      }
    },
    descricao: `${plano.nome} - ${tarefasSelecionadas.length} tarefa(s) em ${equipamentosSelecionados.length} equipamento(s)`,
    tipo: 'PREVENTIVA', // Planos geralmente são preventivos
    prioridade: 'MEDIA', // Padrão para planos
    tempoEstimado: totalTempo,
    duracaoEstimada: totalDuracao,
    observacoes: `Gerada do plano "${plano.nome}" com ${tarefasSelecionadas.length} tarefa(s): ${tarefasSelecionadas.map(t => t.tagBase).join(', ')}`
  };

  navigate('/programacao-os', {
    state: {
      preselectedData: dadosPreselcionados
    }
  });
};

/**
 * Planejar OS a partir de uma Tarefa Individual
 */
export const planejarOSComTarefa = (
  tarefa: Tarefa, 
  navigate: NavigateFunction
) => {
  console.log('🏷️ Planejando OS para tarefa:', tarefa.id);

  const dadosPreselcionados: DadosPreselcionados = {
    origem: {
      tipo: 'TAREFA',
      item: tarefa,
      dados: {
        tarefaId: tarefa.id,
        tarefaTag: tarefa.tag,
        tarefaDescricao: tarefa.descricao,
        equipamentoId: tarefa.equipamentoId,
        plantaId: tarefa.plantaId
      }
    },
    descricao: `${tarefa.tag}: ${tarefa.descricao}`,
    tipo: tarefa.tipoManutencao,
    prioridade: tarefa.criticidade === '5' ? 'CRITICA' : 
                 tarefa.criticidade === '4' ? 'ALTA' : 
                 tarefa.criticidade === '3' ? 'MEDIA' : 'BAIXA',
    tempoEstimado: tarefa.tempoEstimado / 60, // converter minutos para horas
    duracaoEstimada: tarefa.duracaoEstimada,
    responsavel: tarefa.responsavel,
    observacoes: `Gerada a partir da tarefa ${tarefa.tag}: ${tarefa.descricao}`
  };

  navigate('/programacao-os', {
    state: {
      preselectedData: dadosPreselcionados
    }
  });
};

/**
 * Mapear prioridade de anomalia para prioridade de OS
 */
export const mapearPrioridadeAnomalia = (prioridadeAnomalia: string): string => {
  const mapeamento: Record<string, string> = {
    'BAIXA': 'BAIXA',
    'MEDIA': 'MEDIA', 
    'ALTA': 'ALTA',
    'CRITICA': 'CRITICA'
  };
  return mapeamento[prioridadeAnomalia] || 'MEDIA';
};

/**
 * Mapear criticidade de tarefa para prioridade de OS
 */
export const mapearCriticidadeTarefa = (criticidade: string): string => {
  const mapeamento: Record<string, string> = {
    '1': 'BAIXA',
    '2': 'BAIXA',
    '3': 'MEDIA',
    '4': 'ALTA',
    '5': 'CRITICA'
  };
  return mapeamento[criticidade] || 'MEDIA';
};

/**
 * Gerar descrição automática baseada na origem
 */
export const gerarDescricaoOS = (
  tipo: 'ANOMALIA' | 'PLANO_MANUTENCAO' | 'TAREFA',
  item: any
): string => {
  switch (tipo) {
    case 'ANOMALIA':
      return `Correção de Anomalia: ${item.descricao}`;
    case 'PLANO_MANUTENCAO':
      return `Manutenção Programada: ${item.nome}`;
    case 'TAREFA':
      return `Execução de Tarefa: ${item.tag} - ${item.descricao}`;
    default:
      return 'Nova Ordem de Serviço';
  }
};