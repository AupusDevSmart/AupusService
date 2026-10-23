// src/features/agenda/config/table-config.tsx
import {
  Calendar,
  Building2,
  Clock,
  Repeat,
  Globe,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { TableColumn } from '@/types/base';
import { formatarDiaDeCalendario } from '@/utils/dia-de-calendario';
import { FeriadoResponse, ConfiguracaoDiasUteisResponse } from '../types';

/** Marca neutra (o padrão da casa: cor só para o que pede atenção). */
const CHIP = 'flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs text-muted-foreground';

// ============================================================================
// FERIADOS TABLE CONFIG
// ============================================================================

export const feriadosTableColumns: TableColumn<FeriadoResponse>[] = [
  {
    key: 'dados_principais',
    label: 'Feriado',
    sortable: true,
    className: 'min-w-[200px] max-w-[280px]',
    render: (feriado) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate" title={feriado.nome}>
            {feriado.nome}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatarDiaDeCalendario(feriado.data)}
        </div>
      </div>
    )
  },
  {
    key: 'tipo',
    label: 'Tipo',
    className: 'min-w-[120px] max-w-[140px]',
    render: (feriado) => {
      const typeConfig = getTipoConfig(feriado.tipo);
      return (
        <span className="text-sm truncate">{typeConfig.label}</span>
      );
    }
  },
  {
    key: 'configuracoes',
    label: 'Configurações',
    className: 'min-w-[140px] max-w-[180px]',
    render: (feriado) => (
      <div className="flex gap-1 flex-wrap">
        {feriado.geral && (
          <div className={CHIP}>
            <Globe className="h-3 w-3" />
            <span>Geral</span>
          </div>
        )}
        {feriado.recorrente && (
          <div className={CHIP}>
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
    className: 'min-w-[140px] max-w-[160px]',
    hideOnMobile: true,
    render: (feriado) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-sm truncate">
          {feriado.geral ? 'Todas as plantas' : `${feriado.total_plantas || 0} plantas`}
        </span>
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    className: 'min-w-[100px] max-w-[120px]',
    hideOnMobile: true,
    render: (feriado) => (
      <div className="flex items-center gap-2">
        {feriado.ativo ? (
          <>
            <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground">Ativo</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">Inativo</span>
          </>
        )}
      </div>
    )
  },
  {
    key: 'informacoes_cadastro',
    label: 'Cadastro',
    className: 'min-w-[120px] max-w-[140px]',
    hideOnTablet: true,
    render: (feriado) => (
      <div className="space-y-1">
        {feriado.created_at && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {formatDate(feriado.created_at)}
            </span>
          </div>
        )}
        {feriado.updated_at && feriado.updated_at !== feriado.created_at && (
          <div className="text-xs text-muted-foreground truncate">
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
    className: 'min-w-[180px] max-w-[240px]',
    render: (config) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate" title={config.nome}>
            {config.nome}
          </span>
        </div>
        {config.descricao && (
          <div className="text-xs text-muted-foreground truncate" title={config.descricao}>
            {config.descricao}
          </div>
        )}
      </div>
    )
  },
  {
    key: 'dias_uteis',
    label: 'Dias Úteis',
    className: 'min-w-[160px] max-w-[200px]',
    render: (config) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">
            {config.total_dias_uteis} {config.total_dias_uteis === 1 ? 'dia' : 'dias'}
          </span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {config.dias_uteis_semana.map((dia) => (
            <span
              key={dia}
              className={CHIP}
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
    className: 'min-w-[140px] max-w-[160px]',
    hideOnMobile: true,
    render: (config) => (
      <div className="space-y-1">
        <div className="flex gap-1 flex-wrap">
          {config.sabado && (
            <div className={CHIP}>
              <span>Sáb</span>
            </div>
          )}
          {config.domingo && (
            <div className={CHIP}>
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
    className: 'min-w-[120px] max-w-[140px]',
    hideOnMobile: true,
    render: (config) => (
      <div className="flex items-center gap-2">
        {config.geral ? (
          <>
            <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-sm truncate">Geral</span>
          </>
        ) : (
          <>
            <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-sm truncate">{config.total_plantas || 0} plantas</span>
          </>
        )}
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    className: 'min-w-[100px] max-w-[120px]',
    hideOnTablet: true,
    render: (config) => (
      <div className="flex items-center gap-2">
        {config.ativo ? (
          <>
            <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground">Ativo</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">Inativo</span>
          </>
        )}
      </div>
    )
  },
  {
    key: 'informacoes_cadastro',
    label: 'Cadastro',
    className: 'min-w-[120px] max-w-[140px]',
    hideOnTablet: true,
    render: (config) => (
      <div className="space-y-1">
        {config.created_at && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {formatDate(config.created_at)}
            </span>
          </div>
        )}
        {config.updated_at && config.updated_at !== config.created_at && (
          <div className="text-xs text-muted-foreground truncate">
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
    NACIONAL: { label: 'Nacional' },
    ESTADUAL: { label: 'Estadual' },
    MUNICIPAL: { label: 'Municipal' },
    PERSONALIZADO: { label: 'Personalizado' }
  };
  return configs[tipo as keyof typeof configs] || { label: tipo };
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