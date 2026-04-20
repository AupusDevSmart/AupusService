// src/features/reservas/components/ReservaModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  loading?: boolean;
}

export function ReservaModal({
  isOpen,
  mode,
  entity,
  onClose,
  onSubmit,
  veiculos,
  reservas,
  reservaId,
  loading = false
}: ReservaModalProps) {
  const [formData, setFormData] = useState<Partial<ReservaFormData>>({});
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        const initialData = {
          tipoSolicitante: 'manual' as const,
          dataInicio: getCurrentDate(),
          dataFim: getCurrentDate(),
          horaInicio: '08:00',
          horaFim: '18:00'
        };
        setFormData(initialData);
        setVeiculoSelecionado(undefined);
      } else if (entity) {
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

        setFormData(processedData);
        setVeiculoSelecionado(entity.veiculoId?.toString());
      }
      setErrors({});
    }
  }, [isOpen, mode, entity]);

  const filtrosDisponibilidade = useMemo(() => ({
    dataInicio: formData.dataInicio || '',
    dataFim: formData.dataFim || '',
    horaInicio: formData.horaInicio,
    horaFim: formData.horaFim,
    excluirReservaId: mode === 'edit' ? reservaId : undefined
  }), [formData.dataInicio, formData.dataFim, formData.horaInicio, formData.horaFim, mode, reservaId]);

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));

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

    if (!validateForm()) return;

    try {
      const dadosCompletos = {
        ...formData as ReservaFormData,
        veiculoId: veiculoSelecionado!,
        dataInicio: formatDateForAPI(formData.dataInicio!, false),
        dataFim: formatDateForAPI(formData.dataFim!, false),
      };

      await onSubmit(dadosCompletos);
    } catch (error) {
      console.error('Erro ao salvar reserva:', error);
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full md:w-[50vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            {mode === 'create' ? 'Nova' : mode === 'edit' ? 'Editar' : 'Visualizar'} Reserva
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Solicitante */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Tipo de Solicitante <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipoSolicitante || ''}
                onChange={(e) => handleInputChange('tipoSolicitante', e.target.value)}
                disabled={isReadOnly}
                className="select-minimal w-full"
              >
                <option value="">Selecione o tipo</option>
                <option value="manual">Manual</option>
                <option value="ordem_servico">Ordem de Serviço</option>
                <option value="viagem">Viagem</option>
                <option value="manutencao">Manutenção</option>
              </select>
              {errors.tipoSolicitante && (
                <p className="text-sm text-red-500">{errors.tipoSolicitante}</p>
              )}
            </div>

            {/* ID do Solicitante */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">ID do Solicitante</label>
              <input
                type="text"
                value={formData.solicitanteId || ''}
                onChange={(e) => handleInputChange('solicitanteId', e.target.value)}
                placeholder="Ex: OS-2025-001, MANUAL-123"
                disabled={isReadOnly}
                className="input-minimal w-full"
              />
            </div>

            {/* Responsável */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Responsável <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.responsavel || ''}
                onChange={(e) => handleInputChange('responsavel', e.target.value)}
                placeholder="Nome do responsável"
                disabled={isReadOnly}
                className="input-minimal w-full"
              />
              {errors.responsavel && (
                <p className="text-sm text-red-500">{errors.responsavel}</p>
              )}
            </div>

            {/* Finalidade */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Finalidade <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.finalidade || ''}
                onChange={(e) => handleInputChange('finalidade', e.target.value)}
                placeholder="Finalidade da reserva"
                disabled={isReadOnly}
                className="input-minimal w-full"
              />
              {errors.finalidade && (
                <p className="text-sm text-red-500">{errors.finalidade}</p>
              )}
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Data Início <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dataInicio || ''}
                onChange={(e) => handleInputChange('dataInicio', e.target.value)}
                disabled={isReadOnly}
                className="input-minimal w-full"
              />
              {errors.dataInicio && (
                <p className="text-sm text-red-500">{errors.dataInicio}</p>
              )}
            </div>

            {/* Hora Início */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Hora Início <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.horaInicio || ''}
                onChange={(e) => handleInputChange('horaInicio', e.target.value)}
                disabled={isReadOnly}
                className="input-minimal w-full"
              />
              {errors.horaInicio && (
                <p className="text-sm text-red-500">{errors.horaInicio}</p>
              )}
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Data Fim <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dataFim || ''}
                onChange={(e) => handleInputChange('dataFim', e.target.value)}
                disabled={isReadOnly}
                className="input-minimal w-full"
              />
              {errors.dataFim && (
                <p className="text-sm text-red-500">{errors.dataFim}</p>
              )}
            </div>

            {/* Hora Fim */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Hora Fim <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.horaFim || ''}
                onChange={(e) => handleInputChange('horaFim', e.target.value)}
                disabled={isReadOnly}
                className="input-minimal w-full"
              />
              {errors.horaFim && (
                <p className="text-sm text-red-500">{errors.horaFim}</p>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Observações</label>
            <textarea
              value={formData.observacoes || ''}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Informações adicionais sobre a reserva..."
              disabled={isReadOnly}
              rows={3}
              className="input-minimal w-full"
            />
          </div>

          {/* Seletor de Veículo */}
          <div className="border-t pt-6">
            <div className="mb-4">
              <label className="block text-base font-medium">
                Selecionar Veículo <span className="text-red-500">*</span>
              </label>
              {(!formData.dataInicio || !formData.dataFim) && (
                <p className="text-sm text-muted-foreground mt-1">
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
                setVeiculoSelecionado(veiculoId);

                if (errors.veiculo) {
                  setErrors(prev => ({ ...prev, veiculo: '' }));
                }
              }}
              disabled={isReadOnly}
            />

            {errors.veiculo && (
              <p className="text-sm text-red-500 mt-2">{errors.veiculo}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-minimal-outline"
            >
              <X className="w-4 h-4 mr-2" />
              {isReadOnly ? 'Fechar' : 'Cancelar'}
            </button>

            {!isReadOnly && (
              <button
                type="submit"
                disabled={loading}
                className="btn-minimal-primary"
              >
                {loading ? 'Salvando...' : mode === 'create' ? 'Criar Reserva' : 'Salvar Alterações'}
              </button>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
