// src/features/anomalias/components/AnomaliaViewSheet.tsx
import { useEffect, useState } from 'react';
import { AnomaliasModal } from './AnomaliasModal';
import { useAnomaliasFilters } from '../hooks/useAnomaliasFilters';
import { anomaliasService } from '@/services/anomalias.service';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';

/**
 * Abre uma anomalia em modo leitura a partir do id, para ser usado de fora da
 * tela de anomalias — hoje, do card de origem da OS.
 *
 * Busca sozinho porque quem chama (a OS) so tem o `anomalia_id`; carregar a
 * anomalia inteira no payload da OS engordaria a resposta para um dado que a
 * maioria dos usuarios nunca abre.
 */

interface AnomaliaViewSheetProps {
  anomaliaId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AnomaliaViewSheet({ anomaliaId, isOpen, onClose }: AnomaliaViewSheetProps) {
  const { formFields } = useAnomaliasFilters({});
  const [anomalia, setAnomalia] = useState<unknown>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const id = anomaliaId?.trim();
    if (!isOpen || !id) return;

    let cancelado = false;
    setCarregando(true);

    anomaliasService
      .findOne(id)
      .then((dados) => {
        if (!cancelado) setAnomalia(dados);
      })
      .catch((error) => {
        if (cancelado) return;
        toast({
          title: 'Erro ao abrir a anomalia',
          description: formatApiError(error),
          variant: 'destructive',
        });
        onClose();
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [anomaliaId, isOpen, onClose]);

  // So monta o sheet com a anomalia em maos: abrir vazio e depois preencher
  // faz o BaseModal semear o formData com o objeto errado.
  if (!isOpen || carregando || !anomalia) return null;

  return (
    <AnomaliasModal
      isOpen={isOpen}
      mode="view"
      entity={anomalia}
      formFields={formFields}
      onClose={onClose}
    />
  );
}
