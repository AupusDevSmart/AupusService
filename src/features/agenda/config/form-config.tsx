// src/features/agenda/config/form-config.tsx
import { FormField } from '@/types/base';
import { PlantasSelector } from '../components/PlantasSelector';
import { DiasUteisSelector } from '../components/DiasUteisSelector';
import { TIPOS_FERIADO } from '../types';

// ============================================================================
// FORM FIELDS PARA FERIADOS
// ============================================================================

// Funções estáveis para render
const PlantasSelectorRender = ({ value, onChange, disabled, mode, entity, onMultipleChange, ...props }: any) => {
  // Usar o valor atual do checkbox geral, não o valor da entidade
  const geralValue = props.geral !== undefined ? props.geral : entity?.geral;

  return (
    <PlantasSelector
      value={value}
      onChange={onChange}
      disabled={disabled}
      mode={mode}
      geral={geralValue}
    />
  );
};

export const feriadosFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'nome',
    label: 'Nome do Feriado',
    type: 'text',
    required: true,
    placeholder: 'Ex: Natal, Dia da Independência...',
    group: 'informacoes_basicas',
  },
  {
    key: 'data',
    label: 'Data',
    type: 'date',
    required: true,
    group: 'informacoes_basicas',
  },
  {
    key: 'tipo',
    label: 'Tipo do Feriado',
    type: 'select',
    required: true,
    options: TIPOS_FERIADO,
    defaultValue: 'NACIONAL',
    group: 'informacoes_basicas',
  },

  // Configurações
  {
    key: 'geral',
    label: 'Abrangência Geral',
    type: 'checkbox',
    required: false,
    defaultValue: true,
    group: 'configuracoes',
  },
  {
    key: 'recorrente',
    label: 'Feriado Recorrente',
    type: 'checkbox',
    required: false,
    defaultValue: false,
    group: 'configuracoes',
  },

  // Descrição
  {
    key: 'descricao',
    label: 'Descrição',
    type: 'textarea',
    required: false,
    placeholder: 'Informações adicionais sobre o feriado...',
    group: 'descricao',
  },

  // Plantas (condicional)
  {
    key: 'plantaIds',
    label: 'Plantas Específicas',
    type: 'custom',
    required: false,
    render: PlantasSelectorRender,
    group: 'plantas',
  }
];

// ============================================================================
// FORM FIELDS PARA CONFIGURAÇÕES DIAS ÚTEIS
// ============================================================================

const DiasUteisSelectorRender = ({ value, onChange, disabled, mode }: any) => (
  <DiasUteisSelector
    value={value}
    onChange={onChange}
    disabled={disabled}
    mode={mode}
  />
);

const PlantasSelectorConfigRender = ({ value, onChange, disabled, mode, entity, onMultipleChange, ...props }: any) => {
  // Usar o valor atual do checkbox geral, não o valor da entidade
  const geralValue = props.geral !== undefined ? props.geral : entity?.geral;

  return (
    <PlantasSelector
      value={value}
      onChange={onChange}
      disabled={disabled}
      mode={mode}
      geral={geralValue}
    />
  );
};

export const configuracoesDiasUteisFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'nome',
    label: 'Nome da Configuração',
    type: 'text',
    required: true,
    placeholder: 'Ex: Padrão Industrial, Escritório, 24h...',
    group: 'informacoes_basicas',
  },
  {
    key: 'descricao',
    label: 'Descrição',
    type: 'textarea',
    required: false,
    placeholder: 'Descreva esta configuração de dias úteis...',
    group: 'informacoes_basicas',
  },

  // Configuração Geral
  {
    key: 'geral',
    label: 'Configuração Geral',
    type: 'checkbox',
    required: false,
    defaultValue: false,
    group: 'abrangencia',
  },

  // Dias da Semana
  {
    key: 'diasSemana',
    label: 'Dias Úteis',
    type: 'custom',
    required: true,
    render: DiasUteisSelectorRender,
    group: 'dias_uteis',
  },

  // Plantas (condicional)
  {
    key: 'plantaIds',
    label: 'Plantas Específicas',
    type: 'custom',
    required: false,
    render: PlantasSelectorConfigRender,
    group: 'plantas',
  }
];

// ============================================================================
// FORM GROUPS CONFIG
// ============================================================================

export const feriadosFormGroups = [
  {
    key: 'informacoes_basicas',
    title: 'Informações Básicas',
    description: 'Dados principais do feriado',
    fields: ['nome', 'data', 'tipo']
  },
  {
    key: 'configuracoes',
    title: 'Configurações',
    description: 'Definições de abrangência e recorrência',
    fields: ['geral', 'recorrente']
  },
  {
    key: 'descricao',
    title: 'Descrição',
    description: 'Informações adicionais',
    fields: ['descricao']
  },
  {
    key: 'plantas',
    title: 'Plantas Específicas',
    description: 'Selecionar plantas quando não for geral',
    fields: ['plantaIds'],
    conditional: {
      field: 'geral',
      value: false
    }
  }
];

export const configuracoesDiasUteisFormGroups = [
  {
    key: 'informacoes_basicas',
    title: 'Informações Básicas',
    description: 'Dados principais da configuração',
    fields: ['nome', 'descricao']
  },
  {
    key: 'abrangencia',
    title: 'Abrangência',
    description: 'Definir se é geral ou específica',
    fields: ['geral']
  },
  {
    key: 'dias_uteis',
    title: 'Dias Úteis',
    description: 'Selecionar os dias da semana',
    fields: ['diasSemana']
  },
  {
    key: 'plantas',
    title: 'Plantas Específicas',
    description: 'Selecionar plantas quando não for geral',
    fields: ['plantaIds'],
    conditional: {
      field: 'geral',
      value: false
    }
  }
];

// ============================================================================
// FORM VALIDATION RULES
// ============================================================================

export const feriadosValidationRules = {
  nome: {
    required: 'Nome do feriado é obrigatório',
    minLength: { value: 3, message: 'Nome deve ter pelo menos 3 caracteres' },
    maxLength: { value: 100, message: 'Nome deve ter no máximo 100 caracteres' }
  },
  data: {
    required: 'Data é obrigatória',
    validate: (value: string) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      return true;
    }
  },
  tipo: {
    required: 'Tipo do feriado é obrigatório'
  },
  plantaIds: {
    validate: (value: string[], context: any) => {
      if (!context.geral && (!value || value.length === 0)) {
        return 'Selecione pelo menos uma planta quando não for geral';
      }
      return true;
    }
  }
};

export const configuracoesDiasUteisValidationRules = {
  nome: {
    required: 'Nome da configuração é obrigatório',
    minLength: { value: 3, message: 'Nome deve ter pelo menos 3 caracteres' },
    maxLength: { value: 100, message: 'Nome deve ter no máximo 100 caracteres' }
  },
  diasSemana: {
    required: 'Selecione pelo menos um dia da semana',
    validate: (value: any) => {
      if (!value || typeof value !== 'object') {
        return 'Selecione pelo menos um dia da semana';
      }

      const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
      const algumDiaSelecionado = dias.some(dia => value[dia] === true);

      if (!algumDiaSelecionado) {
        return 'Selecione pelo menos um dia da semana';
      }

      return true;
    }
  },
  plantaIds: {
    validate: (value: string[], context: any) => {
      if (!context.geral && (!value || value.length === 0)) {
        return 'Selecione pelo menos uma planta quando não for geral';
      }
      return true;
    }
  }
};

// ============================================================================
// FORM DEFAULTS
// ============================================================================

export const feriadosFormDefaults = {
  nome: '',
  data: '',
  tipo: 'NACIONAL',
  geral: true,
  recorrente: false,
  descricao: '',
  plantaIds: []
};

export const configuracoesDiasUteisFormDefaults = {
  nome: '',
  descricao: '',
  geral: false,
  segunda: true,
  terca: true,
  quarta: true,
  quinta: true,
  sexta: true,
  sabado: false,
  domingo: false,
  plantaIds: []
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function transformFeriadoFormData(formData: any) {
  return {
    nome: formData.nome,
    data: formData.data,
    tipo: formData.tipo,
    geral: formData.geral,
    recorrente: formData.recorrente,
    descricao: formData.descricao || undefined,
    plantaIds: formData.geral ? undefined : formData.plantaIds
  };
}

export function transformConfiguracaoDiasUteisFormData(formData: any) {
  return {
    nome: formData.nome,
    descricao: formData.descricao || undefined,
    segunda: formData.diasSemana?.segunda || false,
    terca: formData.diasSemana?.terca || false,
    quarta: formData.diasSemana?.quarta || false,
    quinta: formData.diasSemana?.quinta || false,
    sexta: formData.diasSemana?.sexta || false,
    sabado: formData.diasSemana?.sabado || false,
    domingo: formData.diasSemana?.domingo || false,
    geral: formData.geral,
    plantaIds: formData.geral ? undefined : formData.plantaIds
  };
}