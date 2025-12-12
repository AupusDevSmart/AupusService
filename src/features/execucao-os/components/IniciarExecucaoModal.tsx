// src/features/execucao-os/components/IniciarExecucaoModal.tsx
import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Play, Users, User, Clock, CheckCircle2, X } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

interface Tecnico {
  id?: string;
  nome: string;
  especialidade?: string;
}

interface IniciarExecucaoModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    equipe_presente: string[];
    responsavel_execucao: string;
    observacoes_inicio?: string;
    data_hora_inicio_real?: string;
  }) => Promise<void>;
  execucao: {
    numeroOS: string;
    descricaoOS: string;
    tecnicos?: Tecnico[];
  };
}

export const IniciarExecucaoModal: React.FC<IniciarExecucaoModalProps> = ({
  open,
  onClose,
  onConfirm,
  execucao
}) => {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [equipeSelecionada, setEquipeSelecionada] = useState<Set<string>>(new Set());
  const [observacoes, setObservacoes] = useState('');

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      // Pre-selecionar todos os técnicos da programação
      const todosIds = new Set(
        (execucao.tecnicos || [])
          .map(t => t.id)
          .filter(Boolean) as string[]
      );
      setEquipeSelecionada(todosIds);
      setObservacoes('');
    }
  }, [open, execucao.tecnicos]);

  const handleToggleTecnico = (tecnicoId: string) => {
    const newSet = new Set(equipeSelecionada);
    if (newSet.has(tecnicoId)) {
      newSet.delete(tecnicoId);
    } else {
      newSet.add(tecnicoId);
    }
    setEquipeSelecionada(newSet);
  };

  const handleConfirm = async () => {
    if (equipeSelecionada.size === 0) {
      alert('Selecione pelo menos um técnico para a equipe');
      return;
    }

    setLoading(true);
    try {
      await onConfirm({
        equipe_presente: Array.from(equipeSelecionada),
        responsavel_execucao: user?.id || '',
        observacoes_inicio: observacoes.trim() || undefined,
        data_hora_inicio_real: new Date().toISOString()
      });
      onClose();
    } catch (error) {
      console.error('Erro ao iniciar execução:', error);
    } finally {
      setLoading(false);
    }
  };

  const tecnicosProgramados = execucao.tecnicos || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Play className="h-5 w-5 text-green-600 dark:text-green-400" />
            Iniciar Execução
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <div className="font-medium text-foreground">OS #{execucao.numeroOS}</div>
            <div className="text-sm">{execucao.descricaoOS}</div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Equipe Presente */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Equipe Presente
              </Label>
              <Badge variant="secondary" className="text-xs">
                {equipeSelecionada.size} de {tecnicosProgramados.length}
              </Badge>
            </div>

            {tecnicosProgramados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/30">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum técnico programado</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[240px] overflow-y-auto border rounded-lg p-3 bg-muted/30">
                {tecnicosProgramados.map((tecnico) => {
                  const isSelected = tecnico.id ? equipeSelecionada.has(tecnico.id) : false;

                  return (
                    <button
                      key={tecnico.id || tecnico.nome}
                      onClick={() => tecnico.id && handleToggleTecnico(tecnico.id)}
                      disabled={!tecnico.id}
                      className={`
                        w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all
                        ${isSelected
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-border bg-card hover:border-muted-foreground/50'
                        }
                        ${!tecnico.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          rounded-full p-1.5
                          ${isSelected
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-muted-foreground'
                          }
                        `}>
                          <User className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-sm">{tecnico.nome}</div>
                          {tecnico.especialidade && (
                            <div className="text-xs text-muted-foreground">
                              {tecnico.especialidade}
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Responsável pela Execução
            </Label>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <Badge variant="outline">{user?.nome || 'Usuário Logado'}</Badge>
            </div>
          </div>

          {/* Data/Hora Início */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Início Real
            </Label>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <span className="text-sm font-mono">
                {new Date().toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-sm font-medium">
              Observações de Início (opcional)
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Condições climáticas, recursos disponíveis, observações da equipe..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {observacoes.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading || equipeSelecionada.size === 0}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="h-4 w-4" />
            {loading ? 'Iniciando...' : 'Iniciar Execução'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
