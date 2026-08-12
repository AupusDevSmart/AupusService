// src/features/planos-manutencao/components/TarefasDoEquipamentoSection.tsx
import { useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TarefasExpandedRow } from './TarefasExpandedRow';
import { usePlanoDoEquipamento } from './PlanoDoEquipamentoContext';
import type { TarefaApiResponse } from '@/services/tarefas.services';

interface TarefasDoEquipamentoSectionProps {
  /** Nulo no cadastro, quando o equipamento ainda nao existe. */
  equipamentoId: string | null;
  classificacao?: string;
  somenteLeitura?: boolean;
  /** Abre o sheet da instrução ao clicar em "ver" numa tarefa. */
  onVerInstrucao?: (tarefa: TarefaApiResponse) => void;
}

/**
 * Tarefas de manutenção deste equipamento, em seção própria.
 *
 * As tarefas são da CÓPIA do plano, não do template: a tela de planos lista só
 * templates, então sem esta seção as tarefas do equipamento — e o estado de
 * herança de cada uma — não apareceriam em lugar nenhum.
 *
 * A escolha do plano ficou em Dados Básicos (SeletorDePlanoField); as duas
 * partes dividem o mesmo estado via PlanoDoEquipamentoContext, então vincular
 * ou trocar o plano lá recarrega esta lista aqui.
 */
export function TarefasDoEquipamentoSection({
  equipamentoId,
  classificacao,
  somenteLeitura = false,
  onVerInstrucao,
}: TarefasDoEquipamentoSectionProps) {
  const {
    planoAtual,
    previa,
    instrucoesOptions,
    carregando,
    refreshTarefas,
    ehUC,
    recarregar,
    planoEscolhidoNoCadastro,
  } = usePlanoDoEquipamento(equipamentoId ?? '', classificacao);

  const criando = !equipamentoId;
  // No cadastro nao ha copia ainda: mostra as tarefas do TEMPLATE escolhido,
  // que e exatamente o que sera copiado ao salvar. Somente leitura — editar
  // aqui mexeria no template e afetaria todos os equipamentos da categoria.
  const planoParaListar = criando ? planoEscolhidoNoCadastro : planoAtual?.id;

  // Id do plano para o qual o cadastro deve abrir. Guarda o ALVO e não um
  // contador: contador dispara no mount da lista e o formulário abriria sozinho.
  const [abrirCadastroPara, setAbrirCadastroPara] = useState<string | null>(null);

  if (!ehUC) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Tarefas de Manutenção</h3>
        {planoAtual && (
          <span className="text-xs text-muted-foreground">
            {previa?.total_tarefas ?? 0} tarefa{(previa?.total_tarefas ?? 0) === 1 ? '' : 's'}
            {(previa?.tarefas_proprias ?? 0) > 0 && ` · ${previa?.tarefas_proprias} própria(s)`}
            {(previa?.tarefas_customizadas ?? 0) > 0 &&
              ` · ${previa?.tarefas_customizadas} customizada(s)`}
          </span>
        )}

        {/* O botão vive aqui, e não dentro da lista, para ficar na mesma linha
            do título. A lista continua dona do formulário — o clique só diz
            para qual plano ele deve abrir. */}
        {planoAtual && !somenteLeitura && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 ml-auto"
            onClick={() => setAbrirCadastroPara(planoAtual.id)}
            title="Adicionar tarefa"
            aria-label="Adicionar tarefa"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {carregando && !criando ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !planoParaListar ? (
        <p className="text-sm text-muted-foreground">
          Nenhum plano {criando ? 'escolhido' : 'vinculado'}. Escolha um plano em Dados técnicos para
          que as tarefas dele apareçam aqui.
        </p>
      ) : (
        <TarefasExpandedRow
          planoId={planoParaListar}
          instrucoesOptions={instrucoesOptions}
          refreshToken={refreshTarefas}
          onVerTarefa={onVerInstrucao ?? (() => {})}
          onTarefasChange={recarregar}
          // No cadastro a lista é do TEMPLATE: editar aqui mexeria no plano da
          // categoria inteira. Depois de salvar, as tarefas viram cópia do
          // equipamento e passam a ser editáveis.
          somenteLeitura={somenteLeitura || criando}
          variante="sheet"
          posicaoBotaoAdicionar="oculto"
          abrirCadastroPara={abrirCadastroPara}
          onCadastroAberto={() => setAbrirCadastroPara(null)}
        />
      )}
    </div>
  );
}
