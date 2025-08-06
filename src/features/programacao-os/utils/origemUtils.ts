// src/features/programacao-os/utils/origemUtils.ts
export const formatarPrioridade = (prioridade: string): string => {
  const labels: Record<string, string> = {
    'BAIXA': 'Baixa',
    'MEDIA': 'Média', 
    'ALTA': 'Alta',
    'CRITICA': 'Crítica'
  };
  return labels[prioridade] || prioridade;
};

export const formatarStatus = (status: string): string => {
  const labels: Record<string, string> = {
    'AGUARDANDO': 'Aguardando',
    'EM_ANALISE': 'Em Análise',
    'OS_GERADA': 'OS Gerada',
    'RESOLVIDA': 'Resolvida',
    'CANCELADA': 'Cancelada'
  };
  return labels[status] || status;
};

export const formatarCategoria = (categoria: string): string => {
  const labels: Record<string, string> = {
    'MOTORES_ELETRICOS': 'Motores Elétricos',
    'BOMBAS_CENTRIFUGAS': 'Bombas Centrífugas',
    'TRANSFORMADORES': 'Transformadores',
    'COMPRESSORES': 'Compressores',
    'PAINEIS_ELETRICOS': 'Painéis Elétricos',
    'INSTRUMENTACAO': 'Instrumentação',
    'OUTROS': 'Outros'
  };
  return labels[categoria] || categoria.replace('_', ' ');
};

export const obterCorPrioridade = (prioridade: string): string => {
  const cores: Record<string, string> = {
    'BAIXA': 'green',
    'MEDIA': 'yellow',
    'ALTA': 'orange', 
    'CRITICA': 'red'
  };
  return cores[prioridade] || 'gray';
};

export const obterCorStatus = (status: string): string => {
  const cores: Record<string, string> = {
    'AGUARDANDO': 'blue',
    'EM_ANALISE': 'purple',
    'OS_GERADA': 'indigo',
    'RESOLVIDA': 'green',
    'CANCELADA': 'red'
  };
  return cores[status] || 'gray';
};

// Função para formatar data para exibição
export const formatarDataExibicao = (data: string): string => {
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Função para calcular tempo decorrido
export const calcularTempoDecorridoAnomalia = (data: string): string => {
  const agora = new Date();
  const dataItem = new Date(data);
  const diffMs = agora.getTime() - dataItem.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDias === 0) return 'Hoje';
  if (diffDias === 1) return 'Ontem';
  if (diffDias < 7) return `${diffDias} dias atrás`;
  if (diffDias < 30) return `${Math.floor(diffDias / 7)} semanas atrás`;
  return `${Math.floor(diffDias / 30)} meses atrás`;
};

// Função para validar se uma anomalia pode gerar OS
export const podeAnomaliaGerarOS = (status: string): boolean => {
  return ['AGUARDANDO', 'EM_ANALISE'].includes(status);
};

// Função para validar se um plano pode ser usado para OS
export const validarPlanoParaOS = (ativo: boolean, totalEquipamentos: number): boolean => {
  return ativo && totalEquipamentos > 0;
};

// Função para formatar data para exibição
export const formatarData = (data: string): string => {
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Função para calcular tempo decorrido
export const calcularTempoDecorrido = (data: string): string => {
  const agora = new Date();
  const dataItem = new Date(data);
  const diffMs = agora.getTime() - dataItem.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDias === 0) return 'Hoje';
  if (diffDias === 1) return 'Ontem';
  if (diffDias < 7) return `${diffDias} dias atrás`;
  if (diffDias < 30) return `${Math.floor(diffDias / 7)} semanas atrás`;
  return `${Math.floor(diffDias / 30)} meses atrás`;
};

// Função para validar se uma anomalia pode gerar OS
export const podeGerarOS = (status: string): boolean => {
  return ['AGUARDANDO', 'EM_ANALISE'].includes(status);
};

// Função para validar se um plano pode ser usado
export const planoDisponivel = (ativo: boolean, totalEquipamentos: number): boolean => {
  return ativo && totalEquipamentos > 0;
};