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

const grupos = [
  { key: 'informacoes_basicas', title: 'Informações Básicas', fields: ['descricao'] },
  { key: 'localizacao', title: 'Localização', fields: ['localizacao'] },
  { key: 'classificacao', title: 'Classificação', fields: ['condicao', 'origem', 'prioridade', 'status'] },
  { key: 'observacoes', title: 'Observações Adicionais', fields: ['observacoes'] },
  { key: 'instrucoes_vinculadas', title: 'Instrucoes Vinculadas', fields: ['instrucoes_ids'] },
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
