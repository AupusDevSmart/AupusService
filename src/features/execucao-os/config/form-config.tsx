// src/features/execucao-os/config/form-config.tsx
import { 
  CheckCircle,
  Package,
  Star
} from 'lucide-react';

import { FormField, FormFieldProps, ModalMode } from '@/types/base';

// ✅ COMPONENTE MELHORADO: Input básico com dark mode
const SimpleInput = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  readonly,
  className = '',
  ...props 
}: any) => (
  <input
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    readOnly={readonly}
    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
      bg-white dark:bg-gray-800 
      text-gray-900 dark:text-gray-100 
      placeholder-gray-500 dark:placeholder-gray-400
      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
      focus:border-blue-500 dark:focus:border-blue-400
      disabled:bg-gray-100 dark:disabled:bg-gray-700 
      disabled:text-gray-500 dark:disabled:text-gray-400
      read-only:bg-gray-50 dark:read-only:bg-gray-750
      ${className}`}
    {...props}
  />
);


// ✅ COMPONENTE MELHORADO: Textarea básico com dark mode
const SimpleTextarea = ({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  readonly,
  rows = 3,
  className = '',
  ...props 
}: any) => (
  <textarea
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    readOnly={readonly}
    rows={rows}
    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
      bg-white dark:bg-gray-800 
      text-gray-900 dark:text-gray-100 
      placeholder-gray-500 dark:placeholder-gray-400
      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
      focus:border-blue-500 dark:focus:border-blue-400
      disabled:bg-gray-100 dark:disabled:bg-gray-700 
      disabled:text-gray-500 dark:disabled:text-gray-400
      read-only:bg-gray-50 dark:read-only:bg-gray-750
      resize-vertical ${className}`}
    {...props}
  />
);

// ✅ COMPONENTE: Checklist de Atividades
const ChecklistAtividadesController = ({ value, onChange, disabled, mode }: FormFieldProps) => {
  const atividades = Array.isArray(value) ? value : [];

  const handleToggleAtividade = (index: number) => {
    if (disabled || mode === 'view') return;
    
    const atividadesAtualizadas = atividades.map((atividade: any, i: number) => 
      i === index 
        ? { 
            ...atividade, 
            concluida: !atividade.concluida,
            concluidaEm: !atividade.concluida ? new Date().toISOString() : undefined,
            concluidaPor: !atividade.concluida ? 'Usuário Atual' : undefined
          }
        : atividade
    );
    
    onChange(atividadesAtualizadas);
  };

  const progresso = atividades.length > 0 ? 
    Math.round((atividades.filter((a: any) => a.concluida).length / atividades.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Checklist de Atividades
        </label>
        <div className="flex items-center gap-2">
          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progresso}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{progresso}%</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {atividades.map((atividade: any, index: number) => (
          <div
            key={atividade.id || index}
            className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
              atividade.concluida
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <input
              type="checkbox"
              checked={atividade.concluida || false}
              onChange={() => handleToggleAtividade(index)}
              disabled={disabled || mode === 'view'}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                atividade.concluida 
                  ? 'text-green-800 dark:text-green-200 line-through' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {atividade.atividade}
              </p>
              {atividade.concluida && atividade.concluidaEm && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Concluída em {new Date(atividade.concluidaEm).toLocaleDateString('pt-BR')} às {' '}
                  {new Date(atividade.concluidaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {atividade.concluidaPor && ` por ${atividade.concluidaPor}`}
                </p>
              )}
              {atividade.observacoes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {atividade.observacoes}
                </p>
              )}
            </div>
          </div>
        ))}
        
        {atividades.length === 0 && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma atividade definida</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ COMPONENTE: Materiais Consumidos
const MateriaisConsumidosController = ({ value, onChange, disabled, mode }: FormFieldProps) => {
  const materiais = Array.isArray(value) ? value : [];

  const handleMaterialChange = (index: number, field: string, newValue: any) => {
    if (disabled || mode === 'view') return;
    
    const materiaisAtualizados = materiais.map((material: any, i: number) => 
      i === index ? { ...material, [field]: newValue } : material
    );
    
    onChange(materiaisAtualizados);
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <Package className="h-4 w-4" />
        Materiais Consumidos
      </label>
      
      <div className="space-y-3">
        {materiais.map((material: any, index: number) => (
          <div
            key={material.id || index}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">Material</label>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {material.descricao}
                </p>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Planejado</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {material.quantidadePlanejada} {material.unidade}
                </p>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Consumido *</label>
                <SimpleInput
                  type="number"
                  value={material.quantidadeConsumida}
                  onChange={(value: string) => handleMaterialChange(index, 'quantidadeConsumida', parseFloat(value) || 0)}
                  disabled={disabled || mode === 'view'}
                  step="0.1"
                  min="0"
                  max={material.quantidadePlanejada ? material.quantidadePlanejada * 1.5 : undefined}
                />
              </div>
            </div>
            
            <div className="mt-3">
              <label className="text-xs text-gray-500 dark:text-gray-400">Observações</label>
              <SimpleTextarea
                value={material.observacoes}
                onChange={(value: string) => handleMaterialChange(index, 'observacoes', value)}
                disabled={disabled || mode === 'view'}
                placeholder="Observações sobre o uso do material..."
                rows={2}
              />
            </div>
          </div>
        ))}
        
        {materiais.length === 0 && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum material definido</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ COMPONENTE: Avaliação de Qualidade
const AvaliacaoQualidadeController = ({ value, onChange, disabled, mode }: FormFieldProps) => {
  const avaliacao = typeof value === 'number' ? value : 0;

  const handleRatingChange = (rating: number) => {
    if (disabled || mode === 'view') return;
    onChange(rating);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <Star className="h-4 w-4" />
        Avaliação de Qualidade
      </label>
      
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleRatingChange(rating)}
            disabled={disabled || mode === 'view'}
            className={`p-1 rounded transition-colors ${
              rating <= avaliacao
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'
            } disabled:cursor-not-allowed`}
          >
            <Star className={`h-6 w-6 ${rating <= avaliacao ? 'fill-current' : ''}`} />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          {avaliacao > 0 ? `${avaliacao}/5` : 'Não avaliado'}
        </span>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {avaliacao === 5 && '⭐ Excelente'}
        {avaliacao === 4 && '👍 Bom'}
        {avaliacao === 3 && '👌 Regular'}
        {avaliacao === 2 && '👎 Ruim'}
        {avaliacao === 1 && '❌ Péssimo'}
        {avaliacao === 0 && 'Clique nas estrelas para avaliar'}
      </div>
    </div>
  );
};

// ✅ CONFIGURAÇÃO DE CAMPOS PRINCIPAL
export const execucaoOSFormFields: FormField[] = [
  // Informações da OS Original (readonly)
  {
    key: 'numeroOS',
    label: 'Número da OS',
    type: 'text',
    showOnlyOnMode: ['view', 'edit']
  },
  {
    key: 'descricaoOS',
    label: 'Descrição da OS',
    type: 'textarea',
    showOnlyOnMode: ['view', 'edit']
  },
  {
    key: 'localAtivo',
    label: 'Local e Ativo',
    type: 'text',
    showOnlyOnMode: ['view', 'edit']
  },

  // Status e Controle de Execução
  {
    key: 'statusExecucao',
    label: 'Status de Execução',
    type: 'select',
    options: [
      { value: 'PROGRAMADA', label: 'Programada' },
      { value: 'EM_EXECUCAO', label: 'Em Execução' },
      { value: 'PAUSADA', label: 'Pausada' },
      { value: 'FINALIZADA', label: 'Finalizada' },
      { value: 'CANCELADA', label: 'Cancelada' }
    ],
    showOnlyOnMode: ['edit'] as ModalMode[]
  },

  // Datas e Horários
  {
    key: 'dataInicioReal',
    label: 'Data de Início Real',
    type: 'date',
    showOnlyOnMode: ['view', 'edit']
  },
  {
    key: 'horaInicioReal',
    label: 'Hora de Início Real',
    type: 'time',
    showOnlyOnMode: ['view', 'edit']
  },
  {
    key: 'dataFimReal',
    label: 'Data de Fim Real',
    type: 'date',
    showOnlyOnMode: ['edit', 'finalizar'] as ModalMode[]
  },
  {
    key: 'horaFimReal',
    label: 'Hora de Fim Real',
    type: 'time',
    showOnlyOnMode: ['edit', 'finalizar'] as ModalMode[]
  },

  // Equipe
  {
    key: 'responsavelExecucao',
    label: 'Responsável pela Execução',
    type: 'text',
    required: true,
    showOnlyOnMode: ['view', 'edit']
  },
  {
    key: 'equipePresente',
    label: 'Equipe Presente',
    type: 'textarea',
    placeholder: 'Lista dos técnicos presentes durante a execução...',
    showOnlyOnMode: ['view', 'edit']
  },

  // Checklist de Atividades
  {
    key: 'checklistAtividades',
    label: 'Atividades',
    type: 'custom',
    render: ({ value, onChange, disabled, mode }) => (
      <ChecklistAtividadesController 
        value={value} 
        onChange={onChange} 
        disabled={disabled}
        mode={mode}
      />
    ),
    colSpan: 2
  },

  // Materiais Consumidos
  {
    key: 'materiaisConsumidos',
    label: 'Materiais',
    type: 'custom',
    render: ({ value, onChange, disabled, mode }) => (
      <MateriaisConsumidosController 
        value={value} 
        onChange={onChange} 
        disabled={disabled}
        mode={mode}
      />
    ),
    colSpan: 2,
    showOnlyOnMode: ['view', 'edit', 'finalizar'] as ModalMode[]
  },

  // Resultados
  {
    key: 'resultadoServico',
    label: 'Resultado do Serviço',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva o que foi realizado e os resultados obtidos...',
    showOnlyOnMode: ['edit', 'finalizar'] as ModalMode[],
    colSpan: 2
  },
  {
    key: 'problemasEncontrados',
    label: 'Problemas Encontrados',
    type: 'textarea',
    placeholder: 'Descreva problemas ou dificuldades encontradas durante a execução...',
    showOnlyOnMode: ['view', 'edit', 'finalizar'] as ModalMode[]
  },
  {
    key: 'recomendacoes',
    label: 'Recomendações',
    type: 'textarea',
    placeholder: 'Recomendações para melhorias ou próximas manutenções...',
    showOnlyOnMode: ['view', 'edit', 'finalizar'] as ModalMode[]
  },
  {
    key: 'proximaManutencao',
    label: 'Próxima Manutenção',
    type: 'text',
    placeholder: 'Ex: Em 6 meses, após 1000 horas...',
    showOnlyOnMode: ['view', 'edit', 'finalizar'] as ModalMode[]
  },

  // Qualidade
  {
    key: 'avaliacaoQualidade',
    label: 'Qualidade',
    type: 'custom',
    render: ({ value, onChange, disabled, mode }) => (
      <AvaliacaoQualidadeController 
        value={value} 
        onChange={onChange} 
        disabled={disabled}
        mode={mode}
      />
    ),
    showOnlyOnMode: ['edit', 'finalizar'] as ModalMode[]
  },
  {
    key: 'observacoesQualidade',
    label: 'Observações de Qualidade',
    type: 'textarea',
    placeholder: 'Comentários sobre a qualidade da execução...',
    showOnlyOnMode: ['view', 'edit', 'finalizar'] as ModalMode[]
  }
];

export default execucaoOSFormFields;