// src/features/reservas/components/ReservaModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VeiculoSelector } from './VeiculoSelector';
import { Car, X } from 'lucide-react';
import { ReservaVeiculo, ReservaFormData, Veiculo } from '../types';
import { 
  formatDateForInput, 
  formatDateForAPI, 
  getCurrentDate,
  isDateInPast,
  isEndDateAfterStartDate 
} from '../utils/date-utils';

interface ReservaModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  entity?: ReservaVeiculo | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  veiculos: Veiculo[];
  reservas: ReservaVeiculo[];
  reservaId?: string;
}

// Função para converter data ISO para formato de input date (YYYY-MM-DD) - REMOVIDA
// Agora usando a função do utils

// Função para obter data atual no formato YYYY-MM-DD - REMOVIDA
// Agora usando a função do utils

export function ReservaModal({
  isOpen,
  mode,
  entity,
  onClose,
  onSubmit,
  veiculos,
  reservas,
  reservaId
}: ReservaModalProps) {
  const [formData, setFormData] = useState<Partial<ReservaFormData>>({});
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializa o formulário
  useEffect(() => {
    console.log('🔧 [RESERVA MODAL] Inicializando modal:', { mode, entity, isOpen });
    
    if (isOpen) {
      if (mode === 'create') {
        const initialData = {
          tipoSolicitante: 'manual' as const,
          dataInicio: getCurrentDate(),
          dataFim: getCurrentDate(),
          horaInicio: '08:00',
          horaFim: '18:00'
        };
        console.log('➕ [RESERVA MODAL] Dados iniciais para criação:', initialData);
        setFormData(initialData);
        setVeiculoSelecionado(undefined);
      } else if (entity) {
        // Processar dados existentes com formatação correta
        const processedData = {
          tipoSolicitante: entity.tipoSolicitante,
          solicitanteId: entity.solicitanteId,
          responsavel: entity.responsavel,
          finalidade: entity.finalidade,
          dataInicio: formatDateForInput(entity.dataInicio),
          dataFim: formatDateForInput(entity.dataFim),
          horaInicio: entity.horaInicio || '08:00',
          horaFim: entity.horaFim || '18:00',
          observacoes: entity.observacoes
        };
        
        console.log('✏️ [RESERVA MODAL] Dados originais da entidade:', {
          dataInicio: entity.dataInicio,
          dataFim: entity.dataFim,
          horaInicio: entity.horaInicio,
          horaFim: entity.horaFim,
          veiculoId: entity.veiculoId,
          veiculoIdType: typeof entity.veiculoId
        });
        
        console.log('🔄 [RESERVA MODAL] Dados processados:', processedData);
        
        setFormData(processedData);
        // Manter o tipo original do veiculoId
        setVeiculoSelecionado(entity.veiculoId);
      }
      setErrors({});
    }
  }, [isOpen, mode, entity]);

  const filtrosDisponibilidade = useMemo(() => {
    const filtros = {
      dataInicio: formData.dataInicio || '',
      dataFim: formData.dataFim || '',
      horaInicio: formData.horaInicio,
      horaFim: formData.horaFim,
      excluirReservaId: mode === 'edit' ? reservaId : undefined
    };
    
    console.log('🔍 [RESERVA MODAL] Filtros de disponibilidade:', filtros);
    return filtros;
  }, [formData.dataInicio, formData.dataFim, formData.horaInicio, formData.horaFim, mode, reservaId]);

  const handleInputChange = (key: string, value: any) => {
    console.log(`📝 [RESERVA MODAL] Campo alterado: ${key} =`, value);
    
    setFormData(prev => {
      const updated = { ...prev, [key]: value };
      console.log('📋 [RESERVA MODAL] FormData atualizado:', updated);
      return updated;
    });
    
    // Limpa erro do campo quando usuário digita
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tipoSolicitante) {
      newErrors.tipoSolicitante = 'Tipo de solicitante é obrigatório';
    }

    if (!formData.responsavel?.trim()) {
      newErrors.responsavel = 'Responsável é obrigatório';
    } else if (formData.responsavel.trim().length < 2) {
      newErrors.responsavel = 'Nome do responsável deve ter pelo menos 2 caracteres';
    }

    if (!formData.finalidade?.trim()) {
      newErrors.finalidade = 'Finalidade é obrigatória';
    } else if (formData.finalidade.trim().length < 5) {
      newErrors.finalidade = 'Finalidade deve ter pelo menos 5 caracteres';
    }

    if (!formData.dataInicio) {
      newErrors.dataInicio = 'Data de início é obrigatória';
    } else if (mode === 'create' && isDateInPast(formData.dataInicio)) {
      newErrors.dataInicio = 'Data de início não pode ser no passado';
    }

    if (!formData.dataFim) {
      newErrors.dataFim = 'Data de fim é obrigatória';
    } else if (formData.dataInicio && formData.dataFim) {
      if (!isEndDateAfterStartDate(formData.dataInicio, formData.dataFim, formData.horaInicio, formData.horaFim)) {
        newErrors.dataFim = 'Data de fim deve ser posterior à data de início';
      }
    }

    if (!formData.horaInicio) {
      newErrors.horaInicio = 'Hora de início é obrigatória';
    }

    if (!formData.horaFim) {
      newErrors.horaFim = 'Hora de fim é obrigatória';
    } else if (formData.horaInicio && formData.horaFim && formData.dataInicio === formData.dataFim) {
      // Validar horários apenas se for o mesmo dia
      if (formData.horaFim <= formData.horaInicio) {
        newErrors.horaFim = 'Hora de fim deve ser posterior à hora de início';
      }
    }

    if (!veiculoSelecionado) {
      newErrors.veiculo = 'Selecione um veículo para a reserva';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('💾 [RESERVA MODAL] Tentando submeter form com dados:', formData);
    console.log('🚗 [RESERVA MODAL] Veículo selecionado:', veiculoSelecionado);
    
    if (!validateForm()) {
      console.log('❌ [RESERVA MODAL] Validação falhou, erros:', errors);
      return;
    }

    setLoading(true);
    try {
      // Preparar dados para envio
      const dadosCompletos = {
        ...formData as ReservaFormData,
        veiculoId: veiculoSelecionado!, // Agora é string
        // Configurar formato das datas baseado no que a API espera
        dataInicio: formatDateForAPI(formData.dataInicio!, false),
        dataFim: formatDateForAPI(formData.dataFim!, false),
      };

      console.log('🚀 [RESERVA MODAL] Enviando dados completos:', dadosCompletos);
      await onSubmit(dadosCompletos);
      console.log('✅ [RESERVA MODAL] Sucesso na submissão');
    } catch (error) {
      console.error('❌ [RESERVA MODAL] Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';

  // Debug do estado atual
  useEffect(() => {
    console.log('🐛 [RESERVA MODAL] Estado atual:', {
      isOpen,
      mode,
      formData,
      veiculoSelecionado,
      hasEntity: !!entity,
      errors
    });
  }, [isOpen, mode, formData, veiculoSelecionado, entity, errors]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            {mode === 'create' ? 'Nova' : mode === 'edit' ? 'Editar' : 'Visualizar'} Reserva
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Debug info - apenas em desenvolvimento */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded text-xs">
              <strong className="text-gray-900 dark:text-gray-100">Debug:</strong> 
              <div className="text-gray-700 dark:text-gray-300 mt-1 space-y-1">
                <div>Dados Originais: {entity?.dataInicio} | {entity?.dataFim}</div>
                <div>Dados Formatados: {formData.dataInicio} | {formData.dataFim}</div>
                <div>Veículo: {veiculoSelecionado}</div>
              </div>
            </div>
          )}

          {/* Grid de campos principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Solicitante */}
            <div className="space-y-2">
              <Label htmlFor="tipoSolicitante">
                Tipo de Solicitante <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.tipoSolicitante || ''}
                onValueChange={(value) => handleInputChange('tipoSolicitante', value)}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="ordem_servico">Ordem de Serviço</SelectItem>
                  <SelectItem value="viagem">Viagem</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipoSolicitante && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.tipoSolicitante}</p>
              )}
            </div>

            {/* ID do Solicitante */}
            <div className="space-y-2">
              <Label htmlFor="solicitanteId">ID do Solicitante</Label>
              <Input
                id="solicitanteId"
                value={formData.solicitanteId || ''}
                onChange={(e) => handleInputChange('solicitanteId', e.target.value)}
                placeholder="Ex: OS-2025-001, MANUAL-123"
                disabled={isReadOnly}
              />
            </div>

            {/* Responsável */}
            <div className="space-y-2">
              <Label htmlFor="responsavel">
                Responsável <span className="text-red-500">*</span>
              </Label>
              <Input
                id="responsavel"
                value={formData.responsavel || ''}
                onChange={(e) => handleInputChange('responsavel', e.target.value)}
                placeholder="Nome do responsável"
                disabled={isReadOnly}
              />
              {errors.responsavel && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.responsavel}</p>
              )}
            </div>

            {/* Finalidade */}
            <div className="space-y-2">
              <Label htmlFor="finalidade">
                Finalidade <span className="text-red-500">*</span>
              </Label>
              <Input
                id="finalidade"
                value={formData.finalidade || ''}
                onChange={(e) => handleInputChange('finalidade', e.target.value)}
                placeholder="Finalidade da reserva"
                disabled={isReadOnly}
              />
              {errors.finalidade && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.finalidade}</p>
              )}
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <Label htmlFor="dataInicio">
                Data Início <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dataInicio"
                type="date"
                value={formData.dataInicio || ''}
                onChange={(e) => handleInputChange('dataInicio', e.target.value)}
                disabled={isReadOnly}
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
              {errors.dataInicio && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.dataInicio}</p>
              )}
            </div>

            {/* Hora Início */}
            <div className="space-y-2">
              <Label htmlFor="horaInicio">
                Hora Início <span className="text-red-500">*</span>
              </Label>
              <Input
                id="horaInicio"
                type="time"
                value={formData.horaInicio || ''}
                onChange={(e) => handleInputChange('horaInicio', e.target.value)}
                disabled={isReadOnly}
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
              {errors.horaInicio && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.horaInicio}</p>
              )}
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <Label htmlFor="dataFim">
                Data Fim <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dataFim"
                type="date"
                value={formData.dataFim || ''}
                onChange={(e) => handleInputChange('dataFim', e.target.value)}
                disabled={isReadOnly}
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
              {errors.dataFim && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.dataFim}</p>
              )}
            </div>

            {/* Hora Fim */}
            <div className="space-y-2">
              <Label htmlFor="horaFim">
                Hora Fim <span className="text-red-500">*</span>
              </Label>
              <Input
                id="horaFim"
                type="time"
                value={formData.horaFim || ''}
                onChange={(e) => handleInputChange('horaFim', e.target.value)}
                disabled={isReadOnly}
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
              {errors.horaFim && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.horaFim}</p>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-gray-900 dark:text-gray-100">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes || ''}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Informações adicionais sobre a reserva..."
              disabled={isReadOnly}
              rows={3}
              className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>

            {/* Seletor de Veículo */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="mb-4">
                <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
                  Selecionar Veículo <span className="text-red-500">*</span>
                </Label>
                {(!formData.dataInicio || !formData.dataFim) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Configure as datas acima para ver os veículos disponíveis
                  </p>
                )}
              </div>
              
              <VeiculoSelector
                veiculos={veiculos}
                reservas={reservas}
                filtrosDisponibilidade={filtrosDisponibilidade}
                veiculoSelecionado={veiculoSelecionado}
                onVeiculoChange={(veiculoId) => {
                  console.log('🔄 [RESERVA MODAL] VeiculoSelector onChange chamado com:', veiculoId);
                  setVeiculoSelecionado(veiculoId);
                  
                  // Limpar erro de validação se havia
                  if (errors.veiculo) {
                    setErrors(prev => ({ ...prev, veiculo: '' }));
                  }
                }}
                disabled={isReadOnly}
              />
              
              {errors.veiculo && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-2">{errors.veiculo}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4 mr-2" />
                {isReadOnly ? 'Fechar' : 'Cancelar'}
              </Button>
              
              {!isReadOnly && (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-white dark:text-white"
                >
                  {loading ? 'Salvando...' : mode === 'create' ? 'Criar Reserva' : 'Salvar Alterações'}
                </Button>
              )}
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}