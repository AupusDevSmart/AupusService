import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import type { Equipamento } from '@/core/features/equipamentos/types';

interface ExcluirEquipamentoDialogProps {
  equipamento: Pick<Equipamento, 'id' | 'nome' | 'classificacao' | 'totalComponentes'> | null;
  onCancelar: () => void;
  onConfirmar: () => void;
}

/**
 * Confirmação de exclusão. UC com componentes não se exclui: a API recusa
 * (os componentes têm histórico próprio), então o diálogo diz o que fazer
 * antes em vez de oferecer um Remover que só daria erro (SN-12).
 */
export function ExcluirEquipamentoDialog({ equipamento, onCancelar, onConfirmar }: ExcluirEquipamentoDialogProps) {
  const componentes = equipamento?.classificacao === 'UC' ? (equipamento.totalComponentes ?? 0) : 0;

  return (
    <AlertDialog open={!!equipamento} onOpenChange={(aberto) => !aberto && onCancelar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{componentes > 0 ? 'Não é possível remover' : 'Confirmar exclusão'}</AlertDialogTitle>
          <AlertDialogDescription>
            {componentes > 0 ? (
              <>
                <strong>{equipamento?.nome}</strong> tem {componentes} componente(s) vinculado(s). Exclua ou transfira os{' '}
                {componentes} componentes antes de remover o equipamento.
              </>
            ) : (
              <>
                Tem certeza que deseja remover o equipamento <strong>{equipamento?.nome}</strong>?
                <br />
                <br />
                Esta ação não pode ser desfeita.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{componentes > 0 ? 'Fechar' : 'Cancelar'}</AlertDialogCancel>
          {componentes === 0 && (
            <AlertDialogAction onClick={onConfirmar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
