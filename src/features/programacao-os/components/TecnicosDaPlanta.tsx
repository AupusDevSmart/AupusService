import { TecnicosCardManager, type TecnicoItem } from '@/components/common/cards/TecnicosCardManager';
import { usePessoasQuePodemAtuar } from '../hooks/usePessoasQuePodemAtuar';
import { opcoesDePessoas, plantaDoFormulario } from '../utils/pessoas';

type TecnicosCardManagerProps = Parameters<typeof TecnicosCardManager>[0];

interface TecnicosDaPlantaProps extends Omit<TecnicosCardManagerProps, 'opcoesDoTecnico'> {
  formData?: Record<string, unknown>;
}

/**
 * A equipe planejada com as pessoas da planta (SN-31): cada linha é um perfil
 * (o que a instrução pede) e, quando alguém é escalado, o usuário. Linha sem
 * pessoa continua valendo — "precisa de um eletricista" antes de saber quem.
 */
export function TecnicosDaPlanta({ formData, disabled, ...props }: TecnicosDaPlantaProps) {
  const { data: pessoas } = usePessoasQuePodemAtuar(plantaDoFormulario(formData), !disabled);
  const opcoesDoTecnico = (tecnico: TecnicoItem) =>
    opcoesDePessoas(pessoas, { id: tecnico.tecnico_id, nome: tecnico.nome });

  return <TecnicosCardManager {...props} disabled={disabled} opcoesDoTecnico={disabled ? undefined : opcoesDoTecnico} />;
}
