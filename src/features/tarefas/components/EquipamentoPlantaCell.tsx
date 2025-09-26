// src/features/tarefas/components/EquipamentoPlantaCell.tsx
import { useEffect, useState } from 'react';
import { Wrench, MapPin } from 'lucide-react';
import { PlantasService } from '@/services/plantas.services';
import { equipamentosApi } from '@/services/equipamentos.services';

interface EquipamentoPlantaCellProps {
  equipamentoId?: string;
  plantaId?: string;
}

export function EquipamentoPlantaCell({ equipamentoId, plantaId }: EquipamentoPlantaCellProps) {
  const [equipamentoNome, setEquipamentoNome] = useState<string>('');
  const [plantaNome, setPlantaNome] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('🔍 EquipamentoPlantaCell - Props recebidas:', { 
      equipamentoId, 
      plantaId,
      equipamentoIdType: typeof equipamentoId,
      plantaIdType: typeof plantaId
    });

    const loadNomes = async () => {
      setLoading(true);

      try {
        // Buscar nome da planta
        if (plantaId && plantaId.trim() !== '') {
          console.log('🏭 Iniciando busca da planta com ID:', plantaId);
          try {
            const planta = await PlantasService.getPlanta(plantaId);
            console.log('🏭 Resposta completa da planta:', planta);
            
            // Verificar diferentes possíveis estruturas de resposta
            const nomePlanta = planta?.nome;
            
            if (nomePlanta) {
              setPlantaNome(nomePlanta);
              console.log('🏭 Nome da planta definido:', nomePlanta);
            } else {
              console.warn('🏭 Nome da planta não encontrado na resposta');
              setPlantaNome(`Planta ${plantaId}`);
            }
          } catch (error) {
            console.error('🏭 Erro ao buscar planta:', error);
            setPlantaNome(`Planta ${plantaId}`);
          }
        } else {
          console.log('🏭 PlantaId inválido ou não fornecido:', plantaId);
          setPlantaNome('Sem planta');
        }

        // Buscar nome do equipamento
        if (equipamentoId && equipamentoId.trim() !== '') {
          console.log('🔧 Iniciando busca do equipamento com ID:', equipamentoId);
          try {
            const equipamento = await equipamentosApi.findOne(equipamentoId);
            console.log('🔧 Resposta completa do equipamento:', equipamento);
            
            // Verificar diferentes possíveis estruturas de resposta
            const nomeEquipamento = equipamento?.nome;
            
            if (nomeEquipamento) {
              setEquipamentoNome(nomeEquipamento);
              console.log('🔧 Nome do equipamento definido:', nomeEquipamento);
            } else {
              console.warn('🔧 Nome do equipamento não encontrado na resposta');
              setEquipamentoNome(`Equipamento ${equipamentoId}`);
            }
          } catch (error) {
            console.error('🔧 Erro ao buscar equipamento:', error);
            setEquipamentoNome(`Equipamento ${equipamentoId}`);
          }
        } else {
          console.log('🔧 EquipamentoId inválido ou não fornecido:', equipamentoId);
          setEquipamentoNome('Sem equipamento');
        }

      } catch (error) {
        console.error('❌ Erro geral ao carregar nomes:', error);
      } finally {
        setLoading(false);
        console.log('✅ Carregamento finalizado');
      }
    };

    loadNomes();
  }, [equipamentoId, plantaId]);

  if (loading) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Wrench className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Carregando...</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  // Fallbacks mais informativos
  const equipamentoDisplay = equipamentoNome || 
                            (equipamentoId ? `Eq. ${equipamentoId}` : 'Sem equipamento');
  const plantaDisplay = plantaNome || 
                       (plantaId ? `Planta ${plantaId}` : 'Sem planta');

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Wrench className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm truncate max-w-32" title={equipamentoDisplay}>
          {equipamentoDisplay}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <MapPin className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground truncate max-w-32" title={plantaDisplay}>
          {plantaDisplay}
        </span>
      </div>
    </div>
  );
}