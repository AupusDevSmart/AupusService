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

interface ReservaModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  entity?: ReservaVeiculo | null;
  onClose: () => void;
  onSubmit: (data: ReservaFormData) => Promise<void>;
  veiculos: Veiculo[];
  reservas: ReservaVeiculo[];
  reservaId?: string;
}

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
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializa o formulário
  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        const initialData = {
          tipoSolicitante: 'manual' as const,
          dataInicio: new Date().toISOString().split('T')[0],
          dataFim: new Date().toISOString().split('T')[0],
          horaInicio: '08:00',
          horaFim: '18:00'
        };
        setFormData(initialData);
        setVeiculoSelecionado(undefined);
      } else if (entity) {
        setFormData({
          tipoSolicitante: entity.tipoSolicitante,
          solicitanteId: entity.solicitanteId,
          responsavel: entity.responsavel,
          finalidade: entity.finalidade,
          dataInicio: entity.dataInicio,
          dataFim: entity.dataFim,
          horaInicio: entity.horaInicio,
          horaFim: entity.horaFim,
          observacoes: entity.observacoes
        });
        setVeiculoSelecionado(entity.veiculoId);
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
    } else {
      const data = new Date(formData.dataInicio);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      if (data < hoje) {
        newErrors.dataInicio = 'Data de início não pode ser no passado';
      }
    }

    if (!formData.dataFim) {
      newErrors.dataFim = 'Data de fim é obrigatória';
    }

    if (!formData.horaInicio) {
      newErrors.horaInicio = 'Hora de início é obrigatória';
    }

    if (!formData.horaFim) {
      newErrors.horaFim = 'Hora de fim é obrigatória';
    }

    if (!veiculoSelecionado) {
      newErrors.veiculo = 'Selecione um veículo para a reserva';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const dadosCompletos: ReservaFormData = {
        ...formData as ReservaFormData,
        veiculoId: veiculoSelecionado!
      };

      await onSubmit(dadosCompletos);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';

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
                <p className="text-sm text-red-500">{errors.tipoSolicitante}</p>
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
                <p className="text-sm text-red-500">{errors.responsavel}</p>
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
                <p className="text-sm text-red-500">{errors.finalidade}</p>
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
              />
              {errors.dataInicio && (
                <p className="text-sm text-red-500">{errors.dataInicio}</p>
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
              />
              {errors.horaInicio && (
                <p className="text-sm text-red-500">{errors.horaInicio}</p>
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
              />
              {errors.dataFim && (
                <p className="text-sm text-red-500">{errors.dataFim}</p>
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
              />
              {errors.horaFim && (
                <p className="text-sm text-red-500">{errors.horaFim}</p>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes || ''}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Informações adicionais sobre a reserva..."
              disabled={isReadOnly}
              rows={3}
            />
          </div>

          {/* Seletor de Veículo */}
          <div className="border-t pt-6">
            <div className="mb-4">
              <Label className="text-base font-medium">
                Selecionar Veículo <span className="text-red-500">*</span>
              </Label>
              {(!formData.dataInicio || !formData.dataFim) && (
                <p className="text-sm text-gray-500 mt-1">
                  Configure as datas acima para ver os veículos disponíveis
                </p>
              )}
            </div>
            
            <VeiculoSelector
              veiculos={veiculos}
              reservas={reservas}
              filtrosDisponibilidade={filtrosDisponibilidade}
              veiculoSelecionado={veiculoSelecionado}
              onVeiculoChange={setVeiculoSelecionado}
              disabled={isReadOnly}
            />
            
            {errors.veiculo && (
              <p className="text-sm text-red-500 mt-2">{errors.veiculo}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            
            {!isReadOnly && (
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? 'Salvando...' : 'Cadastrar'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}