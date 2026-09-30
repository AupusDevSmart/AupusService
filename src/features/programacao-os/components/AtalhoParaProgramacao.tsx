// src/features/programacao-os/components/AtalhoParaProgramacao.tsx
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/useUserStore';
import { atalhoDaOrigem, linkDeProgramacao } from '../utils/link-de-programacao';

interface AtalhoParaProgramacaoProps {
  tipo: 'ANOMALIA' | 'SOLICITACAO_SERVICO';
  id: string | undefined | null;
  status: string | undefined | null;
}

const NOME: Record<AtalhoParaProgramacaoProps['tipo'], string> = {
  ANOMALIA: 'Esta anomalia',
  SOLICITACAO_SERVICO: 'Esta solicitação',
};

/**
 * "Programar" / "Ver programação" no topo do sheet da anomalia ou da
 * solicitação. Leva à programação com a origem já escolhida — antes eram 4 a 5
 * ações e uma busca por algo que a pessoa já estava vendo. Só navega: a
 * programação é preenchida lá, por quem programa.
 */
export function AtalhoParaProgramacao({ tipo, id, status }: AtalhoParaProgramacaoProps) {
  const navigate = useNavigate();
  const temPermissao = useUserStore((s) => s.hasPermission);
  const atalho = atalhoDaOrigem(status);

  if (!id?.trim() || !atalho || !temPermissao(atalho.permissao)) return null;

  const programar = atalho.rotulo === 'Programar';
  const Icone = programar ? CalendarPlus : ExternalLink;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
      <p className="text-sm text-muted-foreground">
        {NOME[tipo]} {programar ? 'ainda não tem programação.' : 'já tem programação em aberto.'}
      </p>
      <Button type="button" size="sm" onClick={() => navigate(linkDeProgramacao(tipo, id))}>
        <Icone className="h-4 w-4 mr-1.5" />
        {atalho.rotulo}
      </Button>
    </div>
  );
}
