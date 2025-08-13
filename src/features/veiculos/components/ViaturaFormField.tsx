// src/features/veiculos/components/ViaturaFormField.tsx

import React from 'react';
import { AlertCircle } from 'lucide-react';
// ✅ IMPORT DIRETO DO ARQUIVO
import { ViaturaSelector } from './ViaturaSelector';
import { ViaturaReservada } from '../../reservas/types';

interface ViaturaFormFieldProps {
  value?: number | ViaturaReservada | null;
  onChange: (value: ViaturaReservada | number | null) => void;
  entity?: any; // Objeto do formulário para extrair dados automaticamente
  mode?: 'simple' | 'complete';
  disabled?: boolean;
  required?: boolean;
  showPeriodSummary?: boolean;
  reservaIdParaExcluir?: string;
  label?: string;
  helpText?: string;
}

// Hook auxiliar para gerenciar estado do campo
export const useViaturaField = (initialValue?: number | ViaturaReservada | null) => {
  const [value, setValue] = React.useState<number | ViaturaReservada | null>(initialValue || null);
  const [error, setError] = React.useState<string | null>(null);

  const onChange = React.useCallback((newValue: ViaturaReservada | number | null) => {
    setValue(newValue);
    setError(null);
  }, []);

  const validate = React.useCallback((required: boolean = false) => {
    if (required && !value) {
      setError('Seleção de veículo obrigatória');
      return false;
    }
    setError(null);
    return true;
  }, [value]);

  const reset = React.useCallback(() => {
    setValue(null);
    setError(null);
  }, []);

  return {
    value,
    onChange,
    error,
    validate,
    reset
  };
};

export const ViaturaFormField: React.FC<ViaturaFormFieldProps> = ({
  value,
  onChange,
  entity,
  mode = 'complete',
  disabled = false,
  required = false,
  showPeriodSummary = true,
  reservaIdParaExcluir,
  label = 'Viatura',
  helpText
}) => {
  // Extrair dados de período da entidade
  const extrairDadosEntity = React.useMemo(() => {
    if (!entity) {
      return {
        dataInicio: '',
        dataFim: '',
        horaInicio: '',
        horaFim: '',
        responsavel: '',
        finalidade: '',
        solicitanteId: ''
      };
    }

    // ✅ LÓGICA MELHORADA: Extrair dados de diferentes estruturas
    let dataInicio = '';
    let dataFim = '';
    let horaInicio = '';
    let horaFim = '';

    // Verificar se tem programação
    if (entity.programacao?.dataProgramada && entity.programacao?.horaProgramada) {
      dataInicio = entity.programacao.dataProgramada;
      dataFim = entity.programacao.dataProgramada; // Mesmo dia por padrão
      horaInicio = entity.programacao.horaProgramada;
      
      // Calcular hora fim baseada na duração estimada
      const duracao = entity.duracaoEstimada || 8;
      const [hora, minuto] = horaInicio.split(':');
      const horaFimCalculada = Math.min(23, parseInt(hora) + Math.ceil(duracao));
      horaFim = String(horaFimCalculada).padStart(2, '0') + ':' + (minuto || '00');
    } 
    // Fallback para campos diretos
    else {
      dataInicio = entity.dataInicio || entity.data_inicio || entity.dataProgramada || '';
      dataFim = entity.dataFim || entity.data_fim || entity.dataProgramada || dataInicio;
      horaInicio = entity.horaInicio || entity.hora_inicio || entity.horaProgramada || '08:00';
      horaFim = entity.horaFim || entity.hora_fim || '17:00';
    }

    return {
      dataInicio,
      dataFim,
      horaInicio,
      horaFim,
      responsavel: entity.responsavel || entity.tecnico || entity.usuario || '',
      finalidade: entity.finalidade || entity.descricao || entity.observacoes || 
                  (entity.numeroOS ? `Execução de ${entity.numeroOS}` : ''),
      solicitanteId: entity.id || entity.numeroOS || entity.codigo || ''
    };
  }, [entity]);

  // Verificar se o período está completo
  const periodoCompleto = React.useMemo(() => {
    const { dataInicio, dataFim, horaInicio, horaFim } = extrairDadosEntity;
    return dataInicio && dataFim && horaInicio && horaFim;
  }, [extrairDadosEntity]);

  // Debug log
  React.useEffect(() => {
    console.log('🔍 ViaturaFormField - Dados extraídos:', {
      entity,
      extraidos: extrairDadosEntity,
      periodoCompleto
    });
  }, [entity, extrairDadosEntity, periodoCompleto]);

  // Se não há período definido, mostrar mensagem informativa
  if (!periodoCompleto) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">Defina o período primeiro</p>
          <p className="text-sm text-gray-500 mt-1">
            Para selecionar uma viatura, é necessário definir:
          </p>
          <ul className="text-xs text-gray-400 mt-2 space-y-1">
            <li>• Data de início {!extrairDadosEntity.dataInicio && '(faltando)'}</li>
            <li>• Data de fim {!extrairDadosEntity.dataFim && '(faltando)'}</li>
            <li>• Horário de início {!extrairDadosEntity.horaInicio && '(faltando)'}</li>
            <li>• Horário de fim {!extrairDadosEntity.horaFim && '(faltando)'}</li>
          </ul>
        </div>

        {helpText && (
          <p className="text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <ViaturaSelector
        value={value || null}
        onChange={onChange}
        dataInicio={extrairDadosEntity.dataInicio}
        dataFim={extrairDadosEntity.dataFim}
        horaInicio={extrairDadosEntity.horaInicio}
        horaFim={extrairDadosEntity.horaFim}
        solicitanteId={extrairDadosEntity.solicitanteId}
        responsavel={extrairDadosEntity.responsavel}
        finalidade={extrairDadosEntity.finalidade}
        mode={mode}
        disabled={disabled}
        required={required}
        showPeriodSummary={showPeriodSummary}
        reservaIdParaExcluir={reservaIdParaExcluir}
      />

      {helpText && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};