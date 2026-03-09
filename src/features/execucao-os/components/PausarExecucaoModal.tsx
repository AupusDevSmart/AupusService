// src/features/execucao-os/components/PausarExecucaoModal.tsx
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
import { Pause, AlertCircle } from 'lucide-react';

interface PausarExecucaoModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { motivo_pausa: string; observacoes?: string }) => Promise<void>;
  execucao: {
    numeroOS: string;
    descricaoOS?: string;
  };
}

export function PausarExecucaoModal({
  open,
  onClose,
  onConfirm,
  execucao,
}: PausarExecucaoModalProps) {
  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      setError('O motivo da pausa é obrigatório');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onConfirm({
        motivo_pausa: motivo.trim(),
        observacoes: observacoes.trim() || undefined,
      });

      // Limpar campos após sucesso
      setMotivo('');
      setObservacoes('');
      onClose();
    } catch (error) {
      console.error('Erro ao pausar execução:', error);
      setError('Erro ao pausar execução. Tente novamente.');
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
            <Pause className="h-5 w-5 text-gray-600" />
            <DialogTitle>Pausar Execução</DialogTitle>
          </div>
          <DialogDescription>
            OS {execucao.numeroOS}
            {execucao.descricaoOS && (
              <span className="block text-sm mt-1">{execucao.descricaoOS}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Motivo da Pausa */}
          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo da Pausa <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Aguardando peças, Condições climáticas, Falta de ferramenta..."
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
              placeholder="Detalhes adicionais sobre a pausa..."
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

          {/* Aviso */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              A execução será pausada e o tempo será contabilizado. Você poderá retomar a
              execução posteriormente através do botão "Retomar".
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Pause className="h-4 w-4 mr-2 animate-pulse" />
                Pausando...
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pausar Execução
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}