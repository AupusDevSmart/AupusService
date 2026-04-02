// src/features/tarefas/components/form/InstrucaoOrigemField.tsx
import React from 'react';
import { ComboboxField } from '@/components/ui/combobox-field';
import { InstrucoesApiService, InstrucaoApiResponse } from '@/services/instrucoes.services';

interface InstrucaoOrigemFieldProps {
  value: string;
  onChange: (value: string) => void;
  onMultipleChange?: (updates: Record<string, unknown>) => void;
  disabled?: boolean;
  options?: { value: string; label: string }[];
  onAnexosCopied?: (files: File[]) => void;
}

const instrucoesApi = new InstrucoesApiService();

async function copiarAnexosInstrucao(instrucaoId: string): Promise<File[]> {
  try {
    const anexos = await instrucoesApi.getAnexos(instrucaoId);
    if (!anexos || anexos.length === 0) return [];

    const files: File[] = [];
    for (const anexo of anexos) {
      try {
        const blob = await instrucoesApi.downloadAnexo(instrucaoId, anexo.id.trim());
        const file = new File([blob], anexo.nome, {
          type: anexo.content_type || 'application/octet-stream',
        });
        files.push(file);
      } catch (err) {
        console.error(`Erro ao copiar anexo ${anexo.nome}:`, err);
      }
    }
    return files;
  } catch {
    return [];
  }
}

export const InstrucaoOrigemField: React.FC<InstrucaoOrigemFieldProps> = ({
  value,
  onChange,
  onMultipleChange,
  disabled,
  options = [],
  onAnexosCopied,
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleChange = async (instrucaoId: string) => {
    // Se limpar seleção, apenas atualizar o valor
    if (!instrucaoId) {
      onChange(instrucaoId);
      return;
    }

    // Se não tem onMultipleChange, apenas setar o valor
    if (!onMultipleChange) {
      onChange(instrucaoId);
      return;
    }

    setLoading(true);
    try {
      const instrucao: InstrucaoApiResponse = await instrucoesApi.findOne(instrucaoId);

      // Mapear sub_instrucoes → sub_tarefas
      const subTarefas = (instrucao.sub_instrucoes || []).map((si) => ({
        descricao: si.descricao,
        obrigatoria: si.obrigatoria,
        tempo_estimado: si.tempo_estimado || 0,
        ordem: si.ordem || 0,
      }));

      // Mapear recursos
      const recursos = (instrucao.recursos || []).map((r) => ({
        tipo: r.tipo,
        descricao: r.descricao,
        quantidade: r.quantidade || 1,
        unidade: r.unidade || '',
        obrigatorio: r.obrigatorio,
      }));

      // Atualizar TODOS os campos de uma vez (incluindo instrucao_id)
      onMultipleChange({
        instrucao_id: instrucaoId,
        tag: instrucao.tag || '',
        nome: instrucao.nome || '',
        descricao: instrucao.descricao || '',
        categoria: instrucao.categoria || 'MECANICA',
        tipo_manutencao: instrucao.tipo_manutencao || 'PREVENTIVA',
        condicao_ativo: instrucao.condicao_ativo || 'PARADO',
        criticidade: String(instrucao.criticidade || 3),
        duracao_estimada: instrucao.duracao_estimada || 1,
        observacoes: instrucao.observacoes || '',
        sub_tarefas: subTarefas,
        recursos: recursos,
      });

      // Copiar anexos da instrução
      if (onAnexosCopied) {
        const files = await copiarAnexosInstrucao(instrucaoId);
        if (files.length > 0) {
          onAnexosCopied(files);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar instrução:', error);
      // Fallback: pelo menos setar o ID
      onChange(instrucaoId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ComboboxField
        label="Instrução de Origem"
        placeholder={loading ? 'Carregando dados da instrução...' : 'Selecione uma instrução (preenche campos automaticamente)'}
        searchPlaceholder="Buscar instrução..."
        emptyText="Nenhuma instrução encontrada."
        options={options}
        value={value || ''}
        onChange={handleChange}
        disabled={disabled || loading}
        required
      />
      {loading && (
        <p className="text-xs text-muted-foreground mt-1">Preenchendo campos e copiando anexos...</p>
      )}
    </div>
  );
};
