// src/features/tarefas/components/EquipamentoPlantaCell.tsx
import { useEffect, useState } from 'react';
import { Wrench, MapPin, Factory } from 'lucide-react';
import { PlantasService } from '@/services/plantas.services';
import { getUnidadesByPlanta } from '@/services/unidades.services';
import { equipamentosApi } from '@/services/equipamentos.services';

interface EquipamentoPlantaCellProps {
  equipamentoId?: string;
  plantaId?: string;
  unidadeId?: string; // NOVO: ID da unidade
}

export function EquipamentoPlantaCell({ equipamentoId, plantaId, unidadeId }: EquipamentoPlantaCellProps) {
  const [equipamentoNome, setEquipamentoNome] = useState<string>('');
  const [plantaNome, setPlantaNome] = useState<string>('');
  const [unidadeNome, setUnidadeNome] = useState<string>(''); // NOVO: Nome da unidade
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('🔍 EquipamentoPlantaCell - Props recebidas:', {
      equipamentoId,
      plantaId,
      unidadeId,
      equipamentoIdType: typeof equipamentoId,
      plantaIdType: typeof plantaId,
      unidadeIdType: typeof unidadeId
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

        // NOVO: Buscar nome da unidade
        if (unidadeId && unidadeId.trim() !== '' && plantaId && plantaId.trim() !== '') {
          console.log('🏢 Iniciando busca da unidade com ID:', unidadeId);
          try {
            const unidades = await getUnidadesByPlanta(plantaId);
            const unidade = unidades?.find(u => u.id === unidadeId);
            console.log('🏢 Resposta completa da unidade:', unidade);

            if (unidade?.nome) {
              setUnidadeNome(unidade.nome);
              console.log('🏢 Nome da unidade definido:', unidade.nome);
            } else {
              console.warn('🏢 Nome da unidade não encontrado na resposta');
              setUnidadeNome(`Unidade ${unidadeId}`);
            }
          } catch (error) {
            console.error('🏢 Erro ao buscar unidade:', error);
            setUnidadeNome(`Unidade ${unidadeId}`);
          }
        } else {
          console.log('🏢 UnidadeId inválido ou não fornecido:', unidadeId);
          setUnidadeNome('');
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
  }, [equipamentoId, plantaId, unidadeId]);

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
  const unidadeDisplay = unidadeNome ||
                        (unidadeId ? `Unidade ${unidadeId}` : '');

  return (
    <div className="space-y-1">
      {/* Equipamento */}
      <div className="flex items-center gap-2">
        <Wrench className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm truncate max-w-32" title={equipamentoDisplay}>
          {equipamentoDisplay}
        </span>
      </div>

      {/* Hierarquia: Planta → Unidade */}
      <div className="flex items-center gap-2">
        <Factory className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground truncate max-w-32" title={plantaDisplay}>
          {plantaDisplay}
        </span>
      </div>

      {/* Unidade (se disponível) */}
      {unidadeDisplay && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate max-w-32" title={unidadeDisplay}>
            → {unidadeDisplay}
          </span>
        </div>
      )}
    </div>
  );
}