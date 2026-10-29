// src/features/programacao-os/components/HerancaDaProposta.tsx
import { useEffect, useState } from 'react';
import { FileCheck } from 'lucide-react';
import { DicaDaConta } from '@/components/common/ComoSeCalcula';
import { formatApiError } from '@/utils/api-error';
import { moeda, propostaApi, type HerancaDaProposta as Heranca } from '@/services/proposta.services';

/**
 * O que a programação nova de uma solicitação recebe da proposta revisada ao
 * salvar (29/out/2026): o servidor aplica (`comAHerancaDaProposta`), e aqui
 * quem programa vê antes o que vai entrar — sem digitar de novo o que a
 * proposta já disse. Uma linha, com o detalhe no ícone.
 */
export function HerancaDaProposta({ solicitacaoId }: { solicitacaoId?: string | null }) {
  const [heranca, setHeranca] = useState<Heranca | null>(null);
  const [falha, setFalha] = useState<string | null>(null);

  useEffect(() => {
    setHeranca(null);
    setFalha(null);
    const id = solicitacaoId?.trim();
    if (!id) return;
    let cancelado = false;
    propostaApi
      .paraProgramar(id)
      .then((lida) => !cancelado && setHeranca(lida))
      .catch((erro) => !cancelado && setFalha(formatApiError(erro)));
    return () => {
      cancelado = true;
    };
  }, [solicitacaoId]);

  if (falha) {
    return <p className="text-xs text-muted-foreground">Não foi possível ler a proposta da solicitação ({falha}). Ao salvar, a programação recebe dela o que houver.</p>;
  }
  if (!heranca) return null;

  const outros = heranca.itens_orcamento.reduce((soma, item) => soma + item.valor, 0);
  const partes = [
    heranca.valores_das_instrucoes.length > 0 &&
      `o valor de ${heranca.valores_das_instrucoes.length} ${heranca.valores_das_instrucoes.length === 1 ? 'instrução' : 'instruções'}`,
    heranca.itens_orcamento.length > 0 && `${moeda(outros)} em outros custos`,
    heranca.necessita_veiculo && 'o pedido de veículo',
  ].filter(Boolean);
  const foraDaProgramacao = heranca.sem_vinculo ?? [];
  if (partes.length === 0 && foraDaProgramacao.length === 0) return null;

  return (
    <div className="flex items-start gap-2 rounded-md border px-3 py-2 text-xs text-muted-foreground">
      <FileCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p className="flex flex-wrap items-center gap-1">
        {partes.length > 0 && `Ao salvar, entram da proposta revisada: ${partes.join(', ')}.`}
        {/* A linha cuja instrução saiu da solicitação (ou foi excluída) não tem para onde ir: dito, não calado */}
        {foraDaProgramacao.length > 0 && ` Ficam de fora (a instrução não está mais na solicitação): ${foraDaProgramacao.join(', ')}.`}
        <DicaDaConta
          rotulo="o que vem da proposta"
          linhas={[
            'Cada instrução com o valor (custo) combinado na proposta; para ajustar só nesta programação, salve e abra em Editar.',
            ...heranca.itens_orcamento.map((item) => `${item.descricao}: ${moeda(item.valor)}`),
            'Frete vira terceiro; deslocamento, veículo; diárias, despesa de campo (o técnico confere). O faturamento direto não entra: o cliente paga ao fornecedor.',
          ]}
        />
      </p>
    </div>
  );
}
