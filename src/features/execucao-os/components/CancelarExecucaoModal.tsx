// src/features/execucao-os/components/CancelarExecucaoModal.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';

interface CancelarExecucaoModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { motivo_cancelamento: string; observacoes?: string }) => Promise<void>;
  execucao: {
    numeroOS: string;
    descricaoOS?: string;
    statusExecucao?: string;
  };
}

export function CancelarExecucaoModal({
  open,
  onClose,
  onConfirm,
  execucao,
}: CancelarExecucaoModalProps) {
  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      setError('O motivo do cancelamento é obrigatório');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onConfirm({
        motivo_cancelamento: motivo.trim(),
        observacoes: observacoes.trim() || undefined,
      });

      // Limpar campos após sucesso
      setMotivo('');
      setObservacoes('');
      onClose();
    } catch (error) {
      console.error('Erro ao cancelar execução:', error);
      setError('Erro ao cancelar execução. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setMotivo('');
      setObservacoes('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <X className="h-5 w-5 text-red-600" />
            <DialogTitle>Cancelar Ordem de Serviço</DialogTitle>
          </div>
          <DialogDescription>
            OS {execucao.numeroOS}
            {execucao.descricaoOS && (
              <span className="block text-sm mt-1">{execucao.descricaoOS}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Aviso importante */}
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-700 dark:text-red-400">Atenção!</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Esta ação é irreversível. A OS será cancelada permanentemente e não poderá ser
                retomada.
                {execucao.statusExecucao === 'EM_EXECUCAO' && (
                  <span className="block mt-1">
                    A execução em andamento será interrompida.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Motivo do Cancelamento */}
          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo do Cancelamento <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Cliente cancelou, Falta de recursos, Mudança de prioridade..."
              className="min-h-[80px]"
              disabled={loading}
            />
          </div>

          {/* Observações Adicionais */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações Adicionais (opcional)</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Detalhes adicionais sobre o cancelamento..."
              className="min-h-[60px]"
              disabled={loading}
            />
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <X className="h-4 w-4 mr-2 animate-pulse" />
                Cancelando...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Confirmar Cancelamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}