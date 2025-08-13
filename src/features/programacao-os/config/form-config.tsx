// src/features/programacao-os/config/form-config.tsx - VERSÃO ATUALIZADA
import React from 'react';
// Importe o componente atualizado
import { OrigemOSController } from '../components/OrigemOSController';
import { ViaturaOSController } from '../components/ViaturaOSController';

// ✅ TIPOS BÁSICOS PARA EVITAR DEPENDÊNCIAS EXTERNAS
interface FormField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'date' | 'time' | 'number' | 'custom';
  required?: boolean;
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  validation?: (value: any) => string | null;
  render?: (props: any) => React.ReactNode;
  colSpan?: number;
  showOnlyOnMode?: string[];
  disabled?: boolean;
}

interface FormFieldProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  entity?: any;
  mode?: string;
}

// ✅ COMPONENTE MELHORADO: Input básico com dark mode
const SimpleInput = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  className = '',
  ...props 
}: any) => (
  <input
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
      bg-white dark:bg-gray-800 
      text-gray-900 dark:text-gray-100 
      placeholder-gray-500 dark:placeholder-gray-400
      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
      focus:border-blue-500 dark:focus:border-blue-400
      disabled:bg-gray-100 dark:disabled:bg-gray-700 
      disabled:text-gray-500 dark:disabled:text-gray-400
      ${className}`}
    {...props}
  />
);

// ✅ COMPONENTE MELHORADO: Select básico com dark mode


// ✅ COMPONENTE: Controle de data e hora para programação com Dark Mode
const DataHoraProgramacaoController = ({ value, onChange, disabled }: FormFieldProps) => {
  const [dataProgramada, setDataProgramada] = React.useState(value?.dataProgramada || '');
  const [horaProgramada, setHoraProgramada] = React.useState(value?.horaProgramada || '');

  const handleDataChange = (data: string) => {
    setDataProgramada(data);
    const newValue = {
      dataProgramada: data,
      horaProgramada
    };
    onChange(newValue);
    console.log('📅 Data programação alterada:', newValue);
  };

  const handleHoraChange = (hora: string) => {
    setHoraProgramada(hora);
    const newValue = {
      dataProgramada,
      horaProgramada: hora
    };
    onChange(newValue);
    console.log('🕐 Hora programação alterada:', newValue);
  };

  // ✅ Sugerir data padrão (amanhã)
  React.useEffect(() => {
    if (!dataProgramada) {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataAmanha = amanha.toISOString().split('T')[0];
      setDataProgramada(dataAmanha);
      onChange({
        dataProgramada: dataAmanha,
        horaProgramada: horaProgramada || '08:00'
      });
    }
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Data da Programação <span className="text-red-500">*</span>
        </label>
        <SimpleInput
          type="date"
          value={dataProgramada}
          onChange={handleDataChange}
          disabled={disabled}
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Hora da Programação <span className="text-red-500">*</span>
        </label>
        <SimpleInput
          type="time"
          value={horaProgramada}
          onChange={handleHoraChange}
          disabled={disabled}
          required
        />
      </div>
    </div>
  );
};

// ✅ CONFIGURAÇÃO DE CAMPOS PRINCIPAL
export const programacaoOSFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'numeroOS',
    label: 'Número da OS',
    type: 'text',
    required: false,
    placeholder: 'Gerado automaticamente',
    disabled: true,
  },
  {
    key: 'descricao',
    label: 'Descrição da OS',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva detalhadamente o serviço a ser executado...',
  },

  // ✅ NOVA SEÇÃO: Origem da OS
  {
    key: 'origem',
    label: 'Origem da OS',
    type: 'custom',
    required: true,
    render: ({ value, onChange, disabled, entity, mode }) => (
      <OrigemOSController 
        value={value} 
        onChange={onChange} 
        disabled={disabled}
        entity={entity}
        mode={mode}
      />
    ),
  },

  // Classificação
  {
    key: 'condicoes',
    label: 'Condições do Ativo',
    type: 'select',
    required: true,
    options: [
      { value: 'PARADO', label: 'Parado' },
      { value: 'FUNCIONANDO', label: 'Funcionando' }
    ],
  },
  {
    key: 'tipo',
    label: 'Tipo de Manutenção',
    type: 'select',
    required: true,
    options: [
      { value: 'PREVENTIVA', label: 'Preventiva' },
      { value: 'PREDITIVA', label: 'Preditiva' },
      { value: 'CORRETIVA', label: 'Corretiva' },
      { value: 'INSPECAO', label: 'Inspeção' },
      { value: 'VISITA_TECNICA', label: 'Visita Técnica' }
    ],
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    type: 'select',
    required: true,
    options: [
      { value: 'BAIXA', label: 'Baixa' },
      { value: 'MEDIA', label: 'Média' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'CRITICA', label: 'Crítica' }
    ],
  },

  // Planejamento
  {
    key: 'tempoEstimado',
    label: 'Tempo Estimado (horas)',
    type: 'text',
    required: true,
    placeholder: 'Ex: 4.5',
    validation: (value) => {
      if (!value) return null;
      const tempo = parseFloat(value);
      if (tempo <= 0) {
        return 'Tempo deve ser maior que zero';
      }
      return null;
    },
  },
  {
    key: 'duracaoEstimada',
    label: 'Duração Estimada (horas)',
    type: 'text',
    required: true,
    placeholder: 'Ex: 6',
    validation: (value) => {
      if (!value) return null;
      const duracao = parseFloat(value);
      if (duracao <= 0) {
        return 'Duração deve ser maior que zero';
      }
      return null;
    },
  },

  // ✅ PROGRAMAÇÃO: Data e hora
  {
    key: 'programacao',
    label: 'Data e Hora da Programação',
    type: 'custom',
    required: true,
    render: ({ value, onChange, disabled }) => (
      <DataHoraProgramacaoController 
        value={value} 
        onChange={onChange} 
        disabled={disabled}
      />
    ),
    showOnlyOnMode: ['programar', 'create']
  },
  {
    key: 'responsavel',
    label: 'Responsável pela Execução',
    type: 'text',
    required: true,
    placeholder: 'Nome do responsável',
    showOnlyOnMode: ['programar', 'create']
  },
  
  // ✅ CAMPO PRINCIPAL - Viatura
  {
    key: 'viatura',
    label: 'Viatura',
    type: 'custom',
    required: false,
    render: ({ value, onChange, disabled, entity, mode }) => (
      <ViaturaOSController 
        value={value} 
        onChange={onChange} 
        disabled={disabled}
        entity={entity}
        mode={mode}
      />
    ),
  },
  
  {
    key: 'time',
    label: 'Time/Equipe',
    type: 'text',
    required: false,
    placeholder: 'Nome da equipe responsável',
    showOnlyOnMode: ['programar']
  },

  // Observações
  {
    key: 'observacoes',
    label: 'Observações Gerais',
    type: 'textarea',
    required: false,
    placeholder: 'Observações sobre o serviço, procedimentos especiais, etc...',
  },
  {
    key: 'observacoesProgramacao',
    label: 'Observações da Programação',
    type: 'textarea',
    required: false,
    placeholder: 'Observações específicas sobre a programação...',
    showOnlyOnMode: ['programar']
  }
];

export default programacaoOSFormFields;