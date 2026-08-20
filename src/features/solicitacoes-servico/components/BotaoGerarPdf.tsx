// src/features/solicitacoes-servico/components/BotaoGerarPdf.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatApiError } from '@/utils/api-error';
import type { Proposta } from '@/services/proposta.services';

/**
 * A proposta corrente do sheet, para quem precisa dela fora da seção que a
 * mantém.
 *
 * Por contexto, e não por prop: o `formFields` do BaseModal é memoizado, e o
 * `render` de cada campo vira componente por `React.createElement`. Passar a
 * proposta por ali trocaria a identidade do componente a cada ajuste de preço —
 * e trocar a identidade DESMONTA e remonta o campo. No caso da própria seção da
 * proposta isso seria um laço: remontar recarrega da API, recarregar reporta,
 * reportar remonta.
 */
const PropostaCorrenteContext = createContext<Proposta | null>(null);

export function PropostaCorrenteProvider({
  proposta,
  children,
}: {
  proposta: Proposta | null;
  children: ReactNode;
}) {
  return (
    <PropostaCorrenteContext.Provider value={proposta}>{children}</PropostaCorrenteContext.Provider>
  );
}

interface BotaoGerarPdfProps {
  numero?: string;
  titulo?: string;
  cliente?: string;
}

/**
 * Gera o PDF da proposta.
 *
 * Fica no pé do formulário, e não dentro da seção da proposta: imprimir é a
 * última coisa que se faz no sheet, não parte de montar o orçamento. Some
 * enquanto não há nada a imprimir.
 */
export function BotaoGerarPdf({ numero, titulo, cliente }: BotaoGerarPdfProps) {
  const proposta = useContext(PropostaCorrenteContext);
  const [gerando, setGerando] = useState(false);

  if (!proposta) return null;

  const gerar = async () => {
    try {
      setGerando(true);
      // Carregada só aqui: a biblioteca é pesada e o bundle já é grande. Quem
      // nunca gera proposta não paga por ela.
      const { gerarPropostaPdf } = await import('@/lib/pdf/proposta');
      await gerarPropostaPdf({ proposta, numero, titulo, cliente });
    } catch (erro) {
      toast.error('Não foi possível gerar o PDF', { description: formatApiError(erro) });
    } finally {
      setGerando(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={gerar} disabled={gerando}>
      {gerando ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-1" />
      )}
      Gerar PDF
    </Button>
  );
}

/**
 * O solicitante com o botão de PDF na mesma linha, fechando o formulário.
 *
 * O render original vem do form-config e usa hooks próprios, então é montado
 * como componente — chamá-lo como função inlinearia os hooks dele aqui.
 */
export function comBotaoDePdf(original: ((props: any) => ReactNode) | undefined) {
  return function SolicitanteComPdf(props: any) {
    const Original = original;

    return (
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">{Original ? <Original {...props} /> : null}</div>
        {/* No cadastro ainda não há entidade: o título vem do que foi digitado. */}
        <BotaoGerarPdf
          numero={props?.entity?.numero}
          titulo={props?.entity?.titulo ?? props?.formData?.titulo}
          cliente={props?.entity?.planta?.nome}
        />
      </div>
    );
  };
}
