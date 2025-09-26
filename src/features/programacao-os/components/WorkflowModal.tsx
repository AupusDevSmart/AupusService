// src/features/programacao-os/components/WorkflowModal.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Save, AlertTriangle, CheckCircle, XCircle, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowModalProps {
  isOpen: boolean;
  action: 'analisar' | 'aprovar' | 'rejeitar' | 'cancelar' | null;
  programacao: any;
  onClose: () => void;
  onConfirm: (data: any) => void;
  loading?: boolean;
}

export function WorkflowModal({
  isOpen,
  action,
  programacao,
  onClose,
  onConfirm,
  loading = false
}: WorkflowModalProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (isOpen && action) {
      // Resetar dados quando modal abre
      setFormData({});
    }
  }, [isOpen, action]);

  if (!isOpen || !action) return null;

  const getModalConfig = () => {
    switch (action) {
      case 'analisar':
        return {
          title: 'Analisar Programação',
          icon: <AlertTriangle className="h-5 w-5 text-purple-600" />,
          description: 'Enviar programação para análise (PENDENTE → EM_ANÁLISE)',
          fields: [
            {
              key: 'observacoes_analise',
              label: 'Observações da Análise',
              type: 'textarea',
              placeholder: 'Observações da análise (opcional)',
              required: false
            }
          ]
        };

      case 'aprovar':
        return {
          title: 'Aprovar Programação',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          description: 'Aprovar programação e gerar OS (EM_ANÁLISE → APROVADA)',
          fields: [
            {
              key: 'observacoes_aprovacao',
              label: 'Observações da Aprovação',
              type: 'textarea',
              placeholder: 'Observações da aprovação (opcional)',
              required: false
            },
            {
              key: 'ajustes_orcamento',
              label: 'Ajustes no Orçamento (R$)',
              type: 'number',
              placeholder: 'Ajustes no valor orçado (opcional)',
              required: false
            },
            {
              key: 'data_programada_sugerida',
              label: 'Data Sugerida',
              type: 'date',
              placeholder: 'Data sugerida para programação',
              required: false
            },
            {
              key: 'hora_programada_sugerida',
              label: 'Hora Sugerida',
              type: 'time',
              placeholder: 'Hora sugerida para programação',
              required: false
            }
          ]
        };

      case 'rejeitar':
        return {
          title: 'Rejeitar Programação',
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          description: 'Rejeitar programação (EM_ANÁLISE → REJEITADA)',
          fields: [
            {
              key: 'motivo_rejeicao',
              label: 'Motivo da Rejeição',
              type: 'textarea',
              placeholder: 'Descreva o motivo da rejeição',
              required: true
            },
            {
              key: 'sugestoes_melhoria',
              label: 'Sugestões de Melhoria',
              type: 'textarea',
              placeholder: 'Sugestões para melhorar a programação (opcional)',
              required: false
            }
          ]
        };

      case 'cancelar':
        return {
          title: 'Cancelar Programação',
          icon: <Ban className="h-5 w-5 text-orange-600" />,
          description: 'Cancelar programação (QUALQUER_STATUS → CANCELADA)',
          fields: [
            {
              key: 'motivo_cancelamento',
              label: 'Motivo do Cancelamento',
              type: 'textarea',
              placeholder: 'Descreva o motivo do cancelamento',
              required: true
            }
          ]
        };

      default:
        return {
          title: 'Ação',
          icon: null,
          description: '',
          fields: []
        };
    }
  };

  const config = getModalConfig();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obrigatórios
    const requiredFields = config.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !formData[field.key]?.trim());

    if (missingFields.length > 0) {
      alert(`⚠️ Campos obrigatórios não preenchidos: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    onConfirm(formData);
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
        <div
          className={cn(
            "w-full max-w-lg bg-background shadow-2xl pointer-events-auto",
            "transform transition-all duration-300 ease-in-out",
            "border rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
          )}
        >
          {/* Header */}
          <div className="bg-background border-b px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {config.icon}
                <div>
                  <h2 className="text-lg font-semibold">{config.title}</h2>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={loading}
                className="h-8 w-8 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Programação Info */}
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Programação: {programacao?.descricao}</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Status: <span className="font-medium">{programacao?.status}</span></div>
                  <div>Local: {programacao?.local}</div>
                  <div>Ativo: {programacao?.ativo}</div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {config.fields.map((field) => (
                  <div key={field.key}>
                    <Label htmlFor={field.key} className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>

                    <div className="mt-1">
                      {field.type === 'textarea' ? (
                        <Textarea
                          id={field.key}
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          disabled={loading}
                          rows={3}
                          className="resize-none"
                        />
                      ) : (
                        <Input
                          id={field.key}
                          type={field.type}
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          disabled={loading}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-background border-t px-6 py-4 flex-shrink-0">
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="w-full flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Confirmar {config.title}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="w-full flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}