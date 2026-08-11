// src/features/planos-manutencao/components/SeletorDePlanoField.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@aupus/shared-pages';
import { Link2, Unlink, AlertTriangle } from 'lucide-react';
import { usePlanoDoEquipamento } from './PlanoDoEquipamentoContext';

interface SeletorDePlanoFieldProps {
  equipamentoId: string;
  classificacao?: string;
  somenteLeitura?: boolean;
}

/**
 * Escolha do plano de manutenção, como campo de Dados Básicos.
 *
 * Só a escolha mora aqui: qual plano rege este equipamento é dado básico dele,
 * na mesma altura de criticidade e localização. As tarefas que vieram do plano
 * são uma lista de trabalho e ganharam seção própria — ver
 * TarefasDoEquipamentoSection.
 */
export function SeletorDePlanoField({
  equipamentoId,
  classificacao,
  somenteLeitura = false,
}: SeletorDePlanoFieldProps) {
  const { planoAtual, templates, carregando, salvando, ehUC, vincular, desvincular } =
    usePlanoDoEquipamento(equipamentoId, classificacao);

  const [selecionado, setSelecionado] = React.useState('');

  const planoOrigemAtual = (planoAtual?.plano_origem_id || '').trim();

  // Espelha o plano vinculado sempre que ele muda no servidor, sem atropelar
  // uma escolha que o usuário acabou de fazer e ainda não aplicou.
  React.useEffect(() => {
    setSelecionado(planoOrigemAtual);
  }, [planoOrigemAtual]);

  if (!ehUC) return null;

  const options = templates.filter((t) => t.id).map((t) => ({ value: t.id.trim(), label: t.nome }));
  const podeAplicar = !!selecionado && selecionado !== planoOrigemAtual;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Plano de Manutenção</label>

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : templates.length === 0 ? (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Nenhum plano disponível. Os planos são criados por{' '}
            <span className="text-foreground">categoria</span>, e só aparecem aqui os da categoria do
            modelo deste equipamento. Sem modelo definido, não há categoria a que se aplicar.
          </span>
        </div>
      ) : somenteLeitura ? (
        <div className="p-2 bg-muted/50 rounded border text-sm">
          {planoAtual?.nome || 'Nenhum plano vinculado'}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 min-w-0">
            <Combobox
              options={options}
              value={selecionado || undefined}
              onValueChange={(val) => setSelecionado((val || '').trim())}
              placeholder="Selecione um plano..."
              searchPlaceholder="Buscar plano..."
              emptyText="Nenhum plano encontrado"
              disabled={salvando}
            />
          </div>

          {/* Só o ícone: o title carrega o significado sem ocupar largura. */}
          <Button
            type="button"
            onClick={() => vincular(selecionado)}
            disabled={!podeAplicar || salvando}
            size="icon"
            title={planoAtual ? 'Substituir plano' : 'Vincular plano'}
            aria-label={planoAtual ? 'Substituir plano' : 'Vincular plano'}
          >
            <Link2 className="h-4 w-4" />
          </Button>

          {planoAtual && (
            <Button
              type="button"
              variant="outline"
              onClick={desvincular}
              disabled={salvando}
              size="icon"
              title="Desvincular plano"
              aria-label="Desvincular plano"
            >
              <Unlink className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
