// src/features/instrucoes/components/AdicionarAoPlanoModal.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@nexon/components/ui/combobox';
import { X, Layers } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { instrucoesApi, AdicionarAoPlanoApiData, FrequenciaTarefa } from '@/services/instrucoes.services';
import { usePlanosManutencaoApi } from '@/features/planos-manutencao/hooks/usePlanosManutencaoApi';

interface AdicionarAoPlanoModalProps {
  isOpen: boolean;
  instrucaoId: string | null;
  instrucaoNome?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const frequenciaOptions = [
  { value: 'DIARIA', label: 'Diária' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINZENAL', label: 'Quinzenal' },
  { value: 'MENSAL', label: 'Mensal' },
  { value: 'BIMESTRAL', label: 'Bimestral' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
  { value: 'PERSONALIZADA', label: 'Personalizada' }
];

export function AdicionarAoPlanoModal({ isOpen, instrucaoId, instrucaoNome, onClose, onSuccess }: AdicionarAoPlanoModalProps) {
  const { user } = useUserStore();
  const { fetchPlanos } = usePlanosManutencaoApi();

  const [planoId, setPlanoId] = useState('');
  const [frequencia, setFrequencia] = useState<FrequenciaTarefa>('MENSAL');
  const [frequenciaPersonalizada, setFrequenciaPersonalizada] = useState<number>(30);
  const [ordem, setOrdem] = useState<number>(1);
  const [planosOptions, setPlanosOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPlanos();
      setPlanoId('');
      setFrequencia('MENSAL');
      setOrdem(1);
      setError(null);
    }
  }, [isOpen]);

  const loadPlanos = async () => {
    try {
      const response = await fetchPlanos({ limit: 100 });
      setPlanosOptions(
        (response.data || [])
          .filter((p: any) => p.id && p.nome)
          .map((p: any) => ({ value: p.id, label: p.nome }))
      );
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
    }
  };

  const handleSubmit = async () => {
    if (!instrucaoId || !planoId) return;

    setLoading(true);
    setError(null);

    try {
      const data: AdicionarAoPlanoApiData = {
        plano_manutencao_id: planoId,
        frequencia,
        ordem,
        ...(frequencia === 'PERSONALIZADA' && { frequencia_personalizada: frequenciaPersonalizada }),
        ...(user?.id && { criado_por: user.id })
      };

      await instrucoesApi.adicionarAoPlano(instrucaoId, data);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Erro ao adicionar ao plano';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md bg-background border rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Adicionar ao Plano</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {instrucaoNome && (
          <p className="text-sm text-muted-foreground mb-4">
            Instrução: <span className="font-medium text-foreground">{instrucaoNome}</span>
          </p>
        )}

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Plano de Manutenção *</Label>
            <Combobox
              options={planosOptions}
              value={planoId || undefined}
              onValueChange={(val) => setPlanoId(val || '')}
              placeholder="Selecione um plano..."
              searchPlaceholder="Buscar plano..."
              emptyText="Nenhum plano encontrado"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-1.5 block">Frequência *</Label>
            <select
              value={frequencia}
              onChange={(e) => setFrequencia(e.target.value as FrequenciaTarefa)}
              className="w-full p-2 text-sm border rounded bg-background text-foreground"
            >
              {frequenciaOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {frequencia === 'PERSONALIZADA' && (
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Frequência Personalizada (dias)</Label>
              <Input
                type="number"
                value={frequenciaPersonalizada}
                onChange={(e) => setFrequenciaPersonalizada(Number(e.target.value))}
                min={1}
                placeholder="Ex: 45"
              />
            </div>
          )}

          <div>
            <Label className="text-sm font-medium mb-1.5 block">Ordem *</Label>
            <Input
              type="number"
              value={ordem}
              onChange={(e) => setOrdem(Number(e.target.value))}
              min={1}
              placeholder="Ex: 1"
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !planoId}>
              {loading ? 'Adicionando...' : 'Adicionar ao Plano'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
