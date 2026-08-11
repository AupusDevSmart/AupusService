// src/features/equipamentos/components/AnexosDoEquipamentoSection.tsx
import { Paperclip } from 'lucide-react';

/**
 * Anexos do equipamento.
 *
 * A aba existe, o armazenamento ainda não. Diferente de anomalias, ordens de
 * serviço, concessionárias, solicitações e instruções — que têm cada uma sua
 * tabela `anexos_*` — o equipamento não tem onde guardar arquivo. O que existe
 * hoje é `equipamentos.foto_url`, uma imagem só, que é a foto acima das abas.
 *
 * Para a aba funcionar de verdade faltam: tabela `anexos_equipamentos`, módulo
 * de upload no api-shared e a rota de servir o arquivo no UploadsController dos
 * DOIS backends (essa rota é duplicada e não está no api-shared — sem ela a
 * imagem volta 404 sem aparecer nos logs).
 */
export function AnexosDoEquipamentoSection() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Anexos</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Ainda não é possível anexar arquivos a um equipamento. A foto continua em cima, junto do
        nome.
      </p>
    </div>
  );
}
