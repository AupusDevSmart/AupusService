// src/features/programacao-os/components/DetalheDaOrigemSheet.tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { BaseModal } from '@aupus/shared-pages';
import { formatApiError } from '@/utils/api-error';
import { AnomaliaViewSheet } from '@/features/anomalias/components/AnomaliaViewSheet';
import { useSolicitacoesFilters } from '@/features/solicitacoes-servico/hooks/useSolicitacoesFilters';
import { usePlanosFilters } from '@/features/planos-manutencao/hooks/usePlanosFilters';

export type OrigemAberta =
  | { tipo: 'ANOMALIA'; id: string }
  | { tipo: 'SOLICITACAO_SERVICO'; id: string }
  | { tipo: 'PLANO_MANUTENCAO'; id: string };

interface DetalheDaOrigemSheetProps {
  /** Nulo mantém tudo fechado. */
  origem: OrigemAberta | null;
  onClose: () => void;
}

/**
 * O registro de origem, aberto em leitura por cima do sheet da OS.
 *
 * Quem está programando precisa conferir o que foi pedido sem perder o
 * formulário — sair para a página da anomalia levaria junto tudo que já foi
 * preenchido.
 *
 * Vai para o `document.body` por PORTAL, pelo mesmo motivo do sheet de
 * instrução: o painel do BaseModal tem `transform` para a animação de entrada, e
 * um elemento com transform vira o bloco de contenção dos `position: fixed` de
 * dentro dele. Sem o portal, este sheet se posicionaria em relação ao de baixo.
 */
export function DetalheDaOrigemSheet({ origem, onClose }: DetalheDaOrigemSheetProps) {
  if (!origem) return null;

  // A anomalia já tinha o seu próprio visualizador por id — reaproveitado, só
  // que dentro do portal.
  if (origem.tipo === 'ANOMALIA') {
    return createPortal(
      <AnomaliaViewSheet anomaliaId={origem.id} isOpen onClose={onClose} />,
      document.body,
    );
  }

  if (origem.tipo === 'SOLICITACAO_SERVICO') {
    return <DetalheSolicitacao id={origem.id} onClose={onClose} />;
  }

  return <DetalhePlano id={origem.id} onClose={onClose} />;
}

/**
 * Carrega um registro por id e abre um BaseModal em modo leitura.
 *
 * Só monta o sheet com o registro em mãos: abrir vazio e preencher depois faz o
 * BaseModal semear o `formData` com o objeto errado — é a mesma armadilha que o
 * `AnomaliaViewSheet` já documenta.
 */
function useRegistro<T>(id: string, buscar: (id: string) => Promise<T>, onClose: () => void) {
  const [registro, setRegistro] = useState<T | null>(null);

  useEffect(() => {
    let cancelado = false;

    void buscar(id.trim())
      .then((dados) => {
        if (!cancelado) setRegistro(dados);
      })
      .catch((erro) => {
        if (cancelado) return;
        toast.error('Não foi possível abrir o registro', { description: formatApiError(erro) });
        onClose();
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return registro;
}

function DetalheSolicitacao({ id, onClose }: { id: string; onClose: () => void }) {
  const { formFields } = useSolicitacoesFilters({});
  const registro = useRegistro(
    id,
    async (alvo) => {
      const { solicitacoesServicoService } = await import('@/services/solicitacoes-servico.service');
      return solicitacoesServicoService.findOne(alvo);
    },
    onClose,
  );

  if (!registro) return null;

  return createPortal(
    <BaseModal
      isOpen
      mode="view"
      entity={registro as any}
      title="Solicitação de serviço"
      formFields={formFields}
      onClose={onClose}
      onSubmit={async () => {}}
      width="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[800px]"
    />,
    document.body,
  );
}

function DetalhePlano({ id, onClose }: { id: string; onClose: () => void }) {
  const { formFields } = usePlanosFilters({});
  const registro = useRegistro(
    id,
    async (alvo) => {
      const { planosManutencaoApi } = await import('@/services/planos-manutencao.services');
      return planosManutencaoApi.findOne(alvo);
    },
    onClose,
  );

  if (!registro) return null;

  return createPortal(
    <BaseModal
      isOpen
      mode="view"
      entity={registro as any}
      title="Plano de manutenção"
      formFields={formFields}
      onClose={onClose}
      onSubmit={async () => {}}
      width="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[800px]"
    />,
    document.body,
  );
}
