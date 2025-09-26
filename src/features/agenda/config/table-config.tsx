// src/features/agenda/config/table-config.tsx
import {
  Calendar,
  Building2,
  Clock,
  Badge,
  Repeat,
  Globe,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { TableColumn } from '@/types/base';
import { FeriadoResponse, ConfiguracaoDiasUteisResponse } from '../types';

// ============================================================================
// FERIADOS TABLE CONFIG
// ============================================================================

export const feriadosTableColumns: TableColumn<FeriadoResponse>[] = [
  {
    key: 'dados_principais',
    label: 'Feriado',
    sortable: true,
    render: (feriado) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="truncate max-w-48" title={feriado.nome}>
            {feriado.nome}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDate(feriado.data)}
        </div>
      </div>
    )
  },
  {
    key: 'tipo',
    label: 'Tipo',
    render: (feriado) => {
      const typeConfig = getTipoConfig(feriado.tipo);
      return (
        <div className="flex items-center gap-2">
          <Badge className={`h-3 w-3 ${typeConfig.color}`} />
          <span className="text-sm">{typeConfig.label}</span>
        </div>
      );
    }
  },
  {
    key: 'configuracoes',
    label: 'Configurações',
    render: (feriado) => (
      <div className="flex gap-2">
        {feriado.geral && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
            <Globe className="h-3 w-3" />
            <span>Geral</span>
          </div>
        )}
        {feriado.recorrente && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
            <Repeat className="h-3 w-3" />
            <span>Recorrente</span>
          </div>
        )}
      </div>
    )
  },
  {
    key: 'plantas',
    label: 'Plantas',
    hideOnMobile: true,
    render: (feriado) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">
          {feriado.geral ? 'Todas as plantas' : `${feriado.total_plantas || 0} plantas`}
        </span>
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    hideOnMobile: true,
    render: (feriado) => (
      <div className="flex items-center gap-2">
        {feriado.ativo ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">Ativo</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">Inativo</span>
          </>
        )}
      </div>
    )
  },
  {
    key: 'informacoes_cadastro',
    label: 'Cadastro',
    hideOnTablet: true,
    render: (feriado) => (
      <div className="space-y-1">
        {feriado.created_at && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatDate(feriado.created_at)}
            </span>
          </div>
        )}
        {feriado.updated_at && feriado.updated_at !== feriado.created_at && (
          <div className="text-xs text-muted-foreground">
            Atualizado: {formatDate(feriado.updated_at)}
          </div>
        )}
      </div>
    )
  }
];

// ============================================================================
// CONFIGURAÇÕES DIAS ÚTEIS TABLE CONFIG
// ============================================================================

export const configuracoesDiasUteisTableColumns: TableColumn<ConfiguracaoDiasUteisResponse>[] = [
  {
    key: 'dados_principais',
    label: 'Configuração',
    sortable: true,
    render: (config) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Clock className="h-4 w-4 text-purple-600" />
          <span className="truncate max-w-48" title={config.nome}>
            {config.nome}
          </span>
        </div>
        {config.descricao && (
          <div className="text-xs text-muted-foreground truncate max-w-48" title={config.descricao}>
            {config.descricao}
          </div>
        )}
      </div>
    )
  },
  {
    key: 'dias_uteis',
    label: 'Dias Úteis',
    render: (config) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">
            {config.total_dias_uteis} {config.total_dias_uteis === 1 ? 'dia' : 'dias'}
          </span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {config.dias_uteis_semana.map((dia) => (
            <span
              key={dia}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
            >
              {getDiaAbreviado(dia)}
            </span>
          ))}
        </div>
      </div>
    )
  },
  {
    key: 'fim_de_semana',
    label: 'Fim de Semana',
    hideOnMobile: true,
    render: (config) => (
      <div className="space-y-1">
        <div className="flex gap-2">
          {config.sabado && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
              <span>Sáb</span>
            </div>
          )}
          {config.domingo && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
              <span>Dom</span>
            </div>
          )}
          {!config.sabado && !config.domingo && (
            <span className="text-xs text-muted-foreground">Não incluído</span>
          )}
        </div>
      </div>
    )
  },
  {
    key: 'abrangencia',
    label: 'Abrangência',
    hideOnMobile: true,
    render: (config) => (
      <div className="flex items-center gap-2">
        {config.geral ? (
          <>
            <Globe className="h-3 w-3 text-blue-600" />
            <span className="text-sm">Geral</span>
          </>
        ) : (
          <>
            <Building2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{config.total_plantas || 0} plantas</span>
          </>
        )}
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    hideOnMobile: true,
    render: (config) => (
      <div className="flex items-center gap-2">
        {config.ativo ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">Ativo</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">Inativo</span>
          </>
        )}
      </div>
    )
  },
  {
    key: 'informacoes_cadastro',
    label: 'Cadastro',
    hideOnTablet: true,
    render: (config) => (
      <div className="space-y-1">
        {config.created_at && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatDate(config.created_at)}
            </span>
          </div>
        )}
        {config.updated_at && config.updated_at !== config.created_at && (
          <div className="text-xs text-muted-foreground">
            Atualizado: {formatDate(config.updated_at)}
          </div>
        )}
      </div>
    )
  }
];

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Data inválida';
  }
}

function getTipoConfig(tipo: string) {
  const configs = {
    NACIONAL: { label: 'Nacional', color: 'text-blue-600' },
    ESTADUAL: { label: 'Estadual', color: 'text-green-600' },
    MUNICIPAL: { label: 'Municipal', color: 'text-orange-600' },
    PERSONALIZADO: { label: 'Personalizado', color: 'text-purple-600' }
  };
  return configs[tipo as keyof typeof configs] || { label: tipo, color: 'text-gray-600' };
}

function getDiaAbreviado(dia: string): string {
  const abreviacoes = {
    'Segunda-feira': 'Seg',
    'Terça-feira': 'Ter',
    'Quarta-feira': 'Qua',
    'Quinta-feira': 'Qui',
    'Sexta-feira': 'Sex',
    'Sábado': 'Sáb',
    'Domingo': 'Dom'
  };
  return abreviacoes[dia as keyof typeof abreviacoes] || dia.substring(0, 3);
}

// ============================================================================
// TABLE CONFIGURATIONS
// ============================================================================

export const feriadosTableConfig = {
  breakpoints: {
    mobile: 640,
    tablet: 768,
    desktop: 1024
  },

  defaultPagination: {
    limit: 10,
    page: 1
  },

  messages: {
    empty: 'Nenhum feriado encontrado',
    loading: 'Carregando feriados...',
    error: 'Erro ao carregar feriados',
    noResults: 'Nenhum resultado encontrado para os filtros aplicados'
  },

  defaultSort: {
    column: 'data',
    direction: 'desc' as const
  },

  actions: {
    view: {
      label: 'Visualizar',
      icon: 'eye',
      variant: 'ghost' as const
    },
    edit: {
      label: 'Editar',
      icon: 'edit',
      variant: 'ghost' as const
    }
  }
} as const;

export const configuracoesDiasUteisTableConfig = {
  breakpoints: {
    mobile: 640,
    tablet: 768,
    desktop: 1024
  },

  defaultPagination: {
    limit: 10,
    page: 1
  },

  messages: {
    empty: 'Nenhuma configuração encontrada',
    loading: 'Carregando configurações...',
    error: 'Erro ao carregar configurações',
    noResults: 'Nenhum resultado encontrado para os filtros aplicados'
  },

  defaultSort: {
    column: 'nome',
    direction: 'asc' as const
  },

  actions: {
    view: {
      label: 'Visualizar',
      icon: 'eye',
      variant: 'ghost' as const
    },
    edit: {
      label: 'Editar',
      icon: 'edit',
      variant: 'ghost' as const
    }
  }
} as const;