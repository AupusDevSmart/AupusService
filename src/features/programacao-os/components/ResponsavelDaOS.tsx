import { Combobox } from '@/core/components/ui/combobox';
import { usePessoasQuePodemAtuar } from '../hooks/usePessoasQuePodemAtuar';
import { nomeDaOpcao, opcoesDePessoas, plantaDoFormulario, textoSemUsuario } from '../utils/pessoas';

interface ResponsavelDaOSProps {
  value?: string | null;
  formData?: Record<string, unknown>;
  onMultipleChange?: (valores: Record<string, unknown>) => void;
  disabled?: boolean;
}

/**
 * Responsável da programação (SN-31): um usuário da equipe da planta ou do
 * apoio, nunca texto livre. Grava o id e o nome juntos; o backend confere a
 * regra e regrava o nome a partir do cadastro.
 */
export function ResponsavelDaOS({ value, formData, onMultipleChange, disabled }: ResponsavelDaOSProps) {
  const plantaId = plantaDoFormulario(formData);
  const nomeAtual = typeof formData?.responsavel === 'string' ? formData.responsavel : null;
  const id = value?.trim() || '';
  const { data: pessoas, isLoading } = usePessoasQuePodemAtuar(plantaId, !disabled);

  if (disabled) {
    return <p className="py-2 text-sm text-foreground">{nomeAtual?.trim() || 'Não definido'}</p>;
  }

  const opcoes = opcoesDePessoas(pessoas, { id, nome: nomeAtual });
  const escolher = (novo: string) =>
    onMultipleChange?.({ responsavel_id: novo || null, responsavel: novo ? nomeDaOpcao(opcoes, novo) : null });

  const aviso = !plantaId
    ? 'Sem planta na origem, só planejamento e gestão aparecem. A equipe aparece ao escolher a origem.'
    : pessoas && pessoas.equipe.length === 0
      ? 'Esta planta ainda não tem técnicos na equipe. Inclua-os no cadastro da planta.'
      : null;

  return (
    <div className="space-y-1.5">
      <Combobox
        options={opcoes}
        value={id}
        onValueChange={escolher}
        placeholder={isLoading ? 'Carregando...' : textoSemUsuario(nomeAtual, id) ?? 'Escolha quem responde pela OS'}
        searchPlaceholder="Buscar pessoa..."
        emptyText="Ninguém com esse nome."
      />
      {aviso && <p className="text-xs text-muted-foreground">{aviso}</p>}
    </div>
  );
}
