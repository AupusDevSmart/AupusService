// src/features/programacao-os/components/WorkflowModal.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Save, CheckCircle, Flag, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowModalProps {
  isOpen: boolean;
  action: 'aprovar' | 'finalizar' | 'cancelar' | null;
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
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (isOpen && action) {
      setObservacoes('');
    }
  }, [isOpen, action]);

  if (!isOpen || !action) return null;

  const getModalConfig = () => {
    switch (action) {
      case 'aprovar':
        return {
          title: 'Aprovar Programacao',
          icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
          description: 'Aprovar programacao (PENDENTE -> APROVADA)',
          observacoesLabel: 'Observacoes',
          observacoesPlaceholder: 'Observacoes da aprovacao (opcional)',
          required: false,
        };

      case 'finalizar':
        return {
          title: 'Finalizar Programacao',
          icon: <Flag className="h-5 w-5 text-blue-600" />,
          description: 'Finalizar programacao (APROVADA -> FINALIZADA)',
          observacoesLabel: 'Observacoes',
          observacoesPlaceholder: 'Observacoes da finalizacao (opcional)',
          required: false,
        };

      case 'cancelar':
        return {
          title: 'Cancelar Programacao',
          icon: <Ban className="h-5 w-5 text-orange-600" />,
          description: 'Cancelar programacao (-> CANCELADA)',
          observacoesLabel: 'Motivo do Cancelamento',
          observacoesPlaceholder: 'Descreva o motivo do cancelamento',
          required: true,
        };

      default:
        return {
          title: 'Acao',
          icon: null,
          description: '',
          observacoesLabel: 'Observacoes',
          observacoesPlaceholder: '',
          required: false,
        };
    }
  };

  const config = getModalConfig();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (config.required && !observacoes.trim()) {
      alert(`Campo obrigatorio: ${config.observacoesLabel}`);
      return;
    }

    onConfirm({ observacoes });
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
              {/* Programacao Info */}
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Programacao: {programacao?.descricao}</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Status: <span className="font-medium">{programacao?.status}</span></div>
                  <div>Local: {programacao?.local}</div>
                  <div>Ativo: {programacao?.ativo}</div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="observacoes" className="text-sm font-medium">
                    {config.observacoesLabel}
                    {config.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <div className="mt-1">
                    <Textarea
                      id="observacoes"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder={config.observacoesPlaceholder}
                      disabled={loading}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
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
