// src/features/instrucoes/components/EditarInstrucaoSheet.tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { formatApiError } from '@/utils/api-error';
import { instrucoesApi, type InstrucaoApiResponse } from '@/services/instrucoes.services';
import { useInstrucoesFilters } from '../hooks/useInstrucoesFilters';
import { InstrucoesModal, type FormularioDaInstrucao } from './InstrucoesModal';

interface EditarInstrucaoSheetProps {
  /** A instrução a abrir. Nulo mantém o sheet fechado. */
  instrucaoId: string | null;
  onClose: () => void;
  /** Chamado depois de salvar, para quem mostra a instrução se atualizar. */
  onSalvo?: () => void;
}

/**
 * O sheet da instrução, aberto de dentro de outro sheet.
 *
 * Existe para não obrigar quem está montando uma solicitação a sair do
 * formulário — abrir a página de instruções perderia tudo que já foi
 * preenchido.
 *
 * Vai para o `document.body` por PORTAL, e não fica onde foi declarado. O
 * painel do BaseModal tem `transform` para a animação de entrada, e um elemento
 * com transform vira o bloco de contenção dos `position: fixed` que estão
 * dentro dele — sem o portal, este sheet se posicionaria em relação ao sheet de
 * baixo, e não à janela.
 *
 * Quem abre precisa desligar o próprio `closeOnEscape` enquanto isto estiver na
 * tela: os dois escutam o Escape no `document`, e uma tecla fecharia os dois de
 * uma vez.
 */
export function EditarInstrucaoSheet({
  instrucaoId,
  onClose,
  onSalvo,
}: EditarInstrucaoSheetProps) {
  const { formFields } = useInstrucoesFilters();
  const [instrucao, setInstrucao] = useState<InstrucaoApiResponse | null>(null);

  useEffect(() => {
    if (!instrucaoId) {
      setInstrucao(null);
      return;
    }

    let cancelado = false;

    void (async () => {
      try {
        const dados = await instrucoesApi.findOne(instrucaoId.trim());
        if (!cancelado) setInstrucao(dados);
      } catch (erro) {
        if (cancelado) return;
        toast.error('Não foi possível abrir a instrução', {
          description: formatApiError(erro),
        });
        onClose();
      }
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instrucaoId]);

  const salvar = async (dados: FormularioDaInstrucao) => {
    if (!instrucao) return;

    // O BaseModal semeia o formData com a entidade inteira; o service manda só o
    // que o DTO aceita (lista branca), senão o `forbidNonWhitelisted` recusaria
    try {
      await instrucoesApi.update(instrucao.id.trim(), dados);
      toast.success('Instrução atualizada');
      onSalvo?.();
      onClose();
    } catch (erro) {
      toast.error('Não foi possível salvar a instrução', {
        description: formatApiError(erro),
      });
    }
  };

  if (!instrucaoId || !instrucao) return null;

  return createPortal(
    <InstrucoesModal
      isOpen
      mode="edit"
      entity={instrucao}
      formFields={formFields}
      onClose={onClose}
      onSubmit={salvar}
      onFilesChange={() => {}}
    />,
    document.body,
  );
}
