// src/features/usuarios/utils/permissoes-utils.ts
import { Permissao } from '@/types/dtos/usuarios-dto';

// ✅ NOVO: Função para extrair todas as permissões automaticamente
// Só precisa manter UMA lista - no tipo Permissao
export const obterTodasPermissoes = (): Permissao[] => {
  // ✅ SIMPLES: Lista todas as permissões em um lugar só
  return [
    'MonitoramentoConsumo',
    'GeracaoEnergia', 
    'GestaoOportunidades',
    'Financeiro',
    'Oportunidades',
    'Prospeccao',
    'ProspeccaoListagem',
    'MonitoramentoClientes',
    'ClubeAupus',
    'Usuarios',
    'Organizacoes',
    'AreaDoProprietario',
    'UnidadesConsumidoras',
    'Configuracoes',
    'AreaDoAssociado',
    'Documentos',
    'Associados',
    'MinhasUsinas',
    'Dashboard',
    'Proprietarios',
    'Equipamentos',
    'Plantas'
  ];
};

// ✅ NOVO: Função para inferir categoria automaticamente pelo nome
const inferirCategoria = (permissao: string): string => {
  const permissaoLower = permissao.toLowerCase();
  
  // Regras simples baseadas no nome
  if (permissaoLower.includes('monitoramento')) return 'Monitoramento';
  if (permissaoLower.includes('geracao') || permissaoLower.includes('unidades')) return 'Energia';
  if (permissaoLower.includes('gestao') || permissaoLower.includes('oportunidad') || permissaoLower.includes('prospeccao')) return 'Gestão';
  if (permissaoLower.includes('financeiro')) return 'Financeiro';
  if (permissaoLower.includes('clube') || permissaoLower.includes('associad')) return 'Clube';
  if (permissaoLower.includes('usuario') || permissaoLower.includes('organizac') || permissaoLower.includes('configurac') || permissaoLower.includes('dashboard')) return 'Sistema';
  if (permissaoLower.includes('proprietario')) return 'Proprietários';
  if (permissaoLower.includes('equipamento') || permissaoLower.includes('planta') || permissaoLower.includes('usina')) return 'Operações';
  if (permissaoLower.includes('documento')) return 'Documentos';
  
  return 'Geral'; // Categoria padrão
};

// ✅ NOVO: Função para formatar nome automaticamente
const formatarNomePermissao = (permissao: string): string => {
  // Mapeamento manual só para casos especiais
  const mapeamentoEspecial: Record<string, string> = {
    'MonitoramentoConsumo': 'Monitoramento de Consumo',
    'MonitoramentoClientes': 'Monitoramento de Clientes', 
    'GeracaoEnergia': 'Geração de Energia',
    'UnidadesConsumidoras': 'Unidades Consumidoras',
    'GestaoOportunidades': 'Gestão de Oportunidades',
    'ProspeccaoListagem': 'Listagem de Prospecção',
    'ClubeAupus': 'Clube Aupus',
    'AreaDoAssociado': 'Área do Associado',
    'AreaDoProprietario': 'Área do Proprietário',
    'MinhasUsinas': 'Minhas Usinas'
  };

  // Se tem mapeamento especial, usa ele
  if (mapeamentoEspecial[permissao]) {
    return mapeamentoEspecial[permissao];
  }

  // Senão, formata automaticamente: "MinhasUsinas" → "Minhas Usinas"
  return permissao
    .replace(/([A-Z])/g, ' $1') // Adiciona espaço antes de maiúsculas
    .replace(/^./, str => str.toUpperCase()) // Primeira letra maiúscula
    .trim();
};

// ✅ NOVO: Função para gerar lista estruturada automaticamente
export const gerarPermissoesEstruturadas = () => {
  const todasPermissoes = obterTodasPermissoes();
  
  return todasPermissoes.map(permissao => ({
    value: permissao,
    label: formatarNomePermissao(permissao),
    group: inferirCategoria(permissao)
  }));
};

// ✅ NOVO: Função para agrupar permissões por categoria
export const agruparPermissoesPorCategoria = () => {
  const permissoesEstruturadas = gerarPermissoesEstruturadas();
  
  return permissoesEstruturadas.reduce((acc, permissao) => {
    if (!acc[permissao.group]) {
      acc[permissao.group] = [];
    }
    acc[permissao.group].push(permissao);
    return acc;
  }, {} as Record<string, Array<{ value: Permissao; label: string; group: string }>>);
};

// ✅ NOVO: Função para obter label de uma permissão
export const obterLabelPermissao = (permissao: Permissao): string => {
  return formatarNomePermissao(permissao);
};