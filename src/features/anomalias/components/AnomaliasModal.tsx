// src/features/anomalias/components/AnomaliasModal.tsx
import { BaseModal } from '@aupus/shared-pages';
import { AlertTriangle } from 'lucide-react';
import type { FormField, ModalMode } from '@/types/base';

/**
 * Sheet de anomalia, extraido da AnomaliasPage.
 *
 * Ele vivia inline na pagina, entao so dava para abrir uma anomalia estando
 * na tela de anomalias. As OS precisam abrir a anomalia que as originou sem
 * sair do sheet da OS — dai a extracao. Os grupos ficam aqui para nao
 * divergirem entre os dois usos.
 */

// ATENCAO: o BaseForm monta cada grupo por ESTA lista e ignora o `group:` do
// campo. Campo que nao esta aqui simplesmente nao renderiza, sem erro nenhum.
const grupos = [
  { key: 'localizacao', title: 'Localização', fields: ['localizacao'] },
  // O prazo entra junto da prioridade: sao a mesma pergunta vista de dois
  // angulos — "quao urgente" e "ate quando". Longe uma da outra, da para marcar
  // CRITICA e nao dar data nenhuma.
  { key: 'classificacao', title: 'Classificação', fields: ['condicao', 'origem', 'prioridade', 'status', 'prazo'] },
  { key: 'descricao', title: 'Descrição Detalhada', fields: ['descricao'] },
  { key: 'anexos', title: 'Anexos', fields: ['anexos'] },
];

const titulos: Record<string, string> = {
  create: 'Nova Anomalia',
  edit: 'Editar Anomalia',
  view: 'Visualizar Anomalia',
};

interface AnomaliasModalProps {
  isOpen: boolean;
  mode: ModalMode;
  entity: unknown;
  formFields: FormField[];
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit?: (data: any) => Promise<void> | void;
}

export function AnomaliasModal({
  isOpen,
  mode,
  entity,
  formFields,
  onClose,
  onSubmit,
}: AnomaliasModalProps) {
  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      mode={mode}
      entity={entity as never}
      title={titulos[mode] || 'Anomalia'}
      icon={<AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
      formFields={formFields}
      onClose={onClose}
      onSubmit={onSubmit as never}
      width="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[800px]"
      groups={grupos}
    />
  );
}
