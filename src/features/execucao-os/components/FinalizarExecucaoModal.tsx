// src/features/execucao-os/components/FinalizarExecucaoModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  X,
  Star,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Package,
  Wrench,
  Shield,
  ClipboardList,
  DollarSign
} from 'lucide-react';

interface Material {
  id: string;
  descricao: string;
  quantidade_planejada: number;
  unidade: string;
}

interface Ferramenta {
  id: string;
  descricao: string;
}

interface FinalizarExecucaoModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    data_hora_fim_real?: string;
    resultado_servico: string;
    problemas_encontrados?: string;
    recomendacoes?: string;
    proxima_manutencao?: string;
    materiais_consumidos: Array<{
      id: string;
      quantidade_consumida: number;
      observacoes?: string;
    }>;
    ferramentas_utilizadas: Array<{
      id: string;
      condicao_depois: string;
      observacoes?: string;
    }>;
    avaliacao_qualidade: number;
    observacoes_qualidade?: string;
    km_final?: number;
    observacoes_veiculo?: string;
    // Novos campos
    atividades_realizadas?: string;
    checklist_concluido?: number;
    procedimentos_seguidos?: string;
    equipamentos_seguranca?: string;
    incidentes_seguranca?: string;
    medidas_seguranca_adicionais?: string;
    custos_adicionais?: number;
  }) => Promise<void>;
  execucao: {
    numeroOS: string;
    descricaoOS: string;
    materiais?: Material[];
    ferramentas?: Ferramenta[];
    reserva_veiculo?: {
      km_inicial?: number;
    };
  };
}

export const FinalizarExecucaoModal: React.FC<FinalizarExecucaoModalProps> = ({
  open,
  onClose,
  onConfirm,
  execucao
}) => {
  const [loading, setLoading] = useState(false);
  const [avaliacao, setAvaliacao] = useState(5);

  // Campos obrigatórios
  const [resultadoServico, setResultadoServico] = useState('');

  // Campos opcionais
  const [problemasEncontrados, setProblemasEncontrados] = useState('');
  const [recomendacoes, setRecomendacoes] = useState('');
  const [proximaManutencao, setProximaManutencao] = useState('');
  const [observacoesQualidade, setObservacoesQualidade] = useState('');

  // Materiais e Ferramentas
  const [materiaisConsumidos, setMateriaisConsumidos] = useState<Map<string, number>>(new Map());
  const [ferramentasCondicao, setFerramentasCondicao] = useState<Map<string, string>>(new Map());

  // Veículo
  const [kmFinal, setKmFinal] = useState('');
  const [observacoesVeiculo, setObservacoesVeiculo] = useState('');

  // Atividades e Procedimentos
  const [atividadesRealizadas, setAtividadesRealizadas] = useState('');
  const [checklistConcluido, setChecklistConcluido] = useState('');
  const [procedimentosSeguidos, setProcedimentosSeguidos] = useState('');

  // Segurança e EPIs
  const [equipamentosSeguranca, setEquipamentosSeguranca] = useState('');
  const [incidentesSeguranca, setIncidentesSeguranca] = useState('');
  const [medidasSegurancaAdicionais, setMedidasSegurancaAdicionais] = useState('');

  // Custos Adicionais
  const [custosAdicionais, setCustosAdicionais] = useState('');

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setAvaliacao(5);
      setResultadoServico('');
      setProblemasEncontrados('');
      setRecomendacoes('');
      setProximaManutencao('');
      setObservacoesQualidade('');
      setMateriaisConsumidos(new Map());
      setFerramentasCondicao(new Map());
      setKmFinal('');
      setObservacoesVeiculo('');
      setAtividadesRealizadas('');
      setChecklistConcluido('');
      setProcedimentosSeguidos('');
      setEquipamentosSeguranca('');
      setIncidentesSeguranca('');
      setMedidasSegurancaAdicionais('');
      setCustosAdicionais('');
    }
  }, [open]);

  const handleMaterialQuantidade = (materialId: string, quantidade: number) => {
    const newMap = new Map(materiaisConsumidos);
    newMap.set(materialId, quantidade);
    setMateriaisConsumidos(newMap);
  };

  const handleFerramentaCondicao = (ferramentaId: string, condicao: string) => {
    const newMap = new Map(ferramentasCondicao);
    newMap.set(ferramentaId, condicao);
    setFerramentasCondicao(newMap);
  };

  const handleConfirm = async () => {
    if (!resultadoServico.trim()) {
      alert('Por favor, descreva o resultado do serviço');
      return;
    }

    if (!atividadesRealizadas.trim()) {
      alert('Por favor, descreva as atividades realizadas');
      return;
    }

    setLoading(true);
    try {
      // Preparar materiais consumidos
      const materiais = Array.from(materiaisConsumidos.entries()).map(([id, qtd]) => ({
        id,
        quantidade_consumida: qtd,
        observacoes: undefined
      }));

      // Preparar ferramentas utilizadas
      const ferramentas = Array.from(ferramentasCondicao.entries()).map(([id, condicao]) => ({
        id,
        condicao_depois: condicao,
        observacoes: undefined
      }));

      await onConfirm({
        data_hora_fim_real: new Date().toISOString(),
        resultado_servico: resultadoServico.trim(),
        problemas_encontrados: problemasEncontrados.trim() || undefined,
        recomendacoes: recomendacoes.trim() || undefined,
        proxima_manutencao: proximaManutencao || undefined,
        materiais_consumidos: materiais,
        ferramentas_utilizadas: ferramentas,
        avaliacao_qualidade: avaliacao,
        observacoes_qualidade: observacoesQualidade.trim() || undefined,
        km_final: kmFinal ? parseFloat(kmFinal) : undefined,
        observacoes_veiculo: observacoesVeiculo.trim() || undefined,
        // Novos campos
        atividades_realizadas: atividadesRealizadas.trim() || undefined,
        checklist_concluido: checklistConcluido ? parseFloat(checklistConcluido) : undefined,
        procedimentos_seguidos: procedimentosSeguidos.trim() || undefined,
        equipamentos_seguranca: equipamentosSeguranca.trim() || undefined,
        incidentes_seguranca: incidentesSeguranca.trim() || undefined,
        medidas_seguranca_adicionais: medidasSegurancaAdicionais.trim() || undefined,
        custos_adicionais: custosAdicionais ? parseFloat(custosAdicionais) : undefined
      });
      onClose();
    } catch (error) {
      console.error('Erro ao finalizar execução:', error);
    } finally {
      setLoading(false);
    }
  };

  const materiais = execucao.materiais || [];
  const ferramentas = execucao.ferramentas || [];
  const temVeiculo = !!execucao.reserva_veiculo;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            Finalizar Execução
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <div className="font-medium text-foreground text-sm sm:text-base">OS #{execucao.numeroOS}</div>
            <div className="text-xs sm:text-sm">{execucao.descricaoOS}</div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resultado do Serviço */}
          <div className="space-y-2">
            <Label htmlFor="resultado" className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Resultado do Serviço
              <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
            </Label>
            <Textarea
              id="resultado"
              placeholder="Descreva o que foi realizado, resultados obtidos e estado final do equipamento..."
              value={resultadoServico}
              onChange={(e) => setResultadoServico(e.target.value)}
              rows={4}
              className="resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              {resultadoServico.length}/1000 caracteres
            </p>
          </div>

          {/* Problemas Encontrados */}
          <div className="space-y-2">
            <Label htmlFor="problemas" className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Problemas Encontrados (opcional)
            </Label>
            <Textarea
              id="problemas"
              placeholder="Descreva problemas, dificuldades ou anomalias encontradas durante a execução..."
              value={problemasEncontrados}
              onChange={(e) => setProblemasEncontrados(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Recomendações */}
          <div className="space-y-2">
            <Label htmlFor="recomendacoes" className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              Recomendações (opcional)
            </Label>
            <Textarea
              id="recomendacoes"
              placeholder="Sugestões de melhorias, ações preventivas ou próximos passos..."
              value={recomendacoes}
              onChange={(e) => setRecomendacoes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Próxima Manutenção */}
          <div className="space-y-2">
            <Label htmlFor="proxima" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próxima Manutenção Sugerida (opcional)
            </Label>
            <Input
              id="proxima"
              type="date"
              value={proximaManutencao}
              onChange={(e) => setProximaManutencao(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Atividades e Procedimentos */}
          <div className="space-y-3 p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              Atividades e Procedimentos
            </Label>

            <div className="space-y-2">
              <Label htmlFor="atividades" className="text-xs font-medium">
                Atividades Realizadas
                <Badge variant="destructive" className="text-xs ml-2">Obrigatório</Badge>
              </Label>
              <Textarea
                id="atividades"
                placeholder="Descreva detalhadamente as atividades executadas..."
                value={atividadesRealizadas}
                onChange={(e) => setAtividadesRealizadas(e.target.value)}
                rows={3}
                className="resize-none text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="checklist" className="text-xs font-medium">
                  Checklist Concluído (%)
                </Label>
                <Input
                  id="checklist"
                  type="number"
                  placeholder="0-100"
                  min="0"
                  max="100"
                  value={checklistConcluido}
                  onChange={(e) => setChecklistConcluido(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="procedimentos" className="text-xs font-medium">
                  Procedimentos Seguidos
                </Label>
                <Textarea
                  id="procedimentos"
                  placeholder="Liste os procedimentos seguidos..."
                  value={procedimentosSeguidos}
                  onChange={(e) => setProcedimentosSeguidos(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Segurança e EPIs */}
          <div className="space-y-3 p-3 sm:p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              Segurança e EPIs
            </Label>

            <div className="space-y-2">
              <Label htmlFor="epis" className="text-xs font-medium">
                EPIs e Equipamentos de Segurança
              </Label>
              <Textarea
                id="epis"
                placeholder="Liste os EPIs utilizados (capacete, luvas, óculos, etc.)..."
                value={equipamentosSeguranca}
                onChange={(e) => setEquipamentosSeguranca(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incidentes" className="text-xs font-medium">
                Incidentes de Segurança
              </Label>
              <Textarea
                id="incidentes"
                placeholder="Relate qualquer incidente ou quase acidente ocorrido..."
                value={incidentesSeguranca}
                onChange={(e) => setIncidentesSeguranca(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medidas" className="text-xs font-medium">
                Medidas de Segurança Adicionais
              </Label>
              <Textarea
                id="medidas"
                placeholder="Medidas extras de segurança que foram adotadas..."
                value={medidasSegurancaAdicionais}
                onChange={(e) => setMedidasSegurancaAdicionais(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>

          {/* Materiais Consumidos */}
          {materiais.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Materiais Consumidos
              </Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3 bg-muted/30">
                {materiais.map((material) => (
                  <div key={material.id} className="flex items-center gap-3 p-2 rounded bg-card border">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{material.descricao}</div>
                      <div className="text-xs text-muted-foreground">
                        Planejado: {material.quantidade_planejada} {material.unidade}
                      </div>
                    </div>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      value={materiaisConsumidos.get(material.id) || ''}
                      onChange={(e) => handleMaterialQuantidade(material.id, parseFloat(e.target.value) || 0)}
                      className="w-24 text-right font-mono"
                    />
                    <span className="text-xs text-muted-foreground w-8">{material.unidade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ferramentas Utilizadas */}
          {ferramentas.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Condição das Ferramentas
              </Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3 bg-muted/30">
                {ferramentas.map((ferramenta) => (
                  <div key={ferramenta.id} className="flex items-center gap-3 p-2 rounded bg-card border">
                    <div className="flex-1 text-sm font-medium">{ferramenta.descricao}</div>
                    <select
                      value={ferramentasCondicao.get(ferramenta.id) || 'BOA'}
                      onChange={(e) => handleFerramentaCondicao(ferramenta.id, e.target.value)}
                      className="px-3 py-1.5 rounded border bg-background text-sm"
                    >
                      <option value="BOA">Boa</option>
                      <option value="REGULAR">Regular</option>
                      <option value="RUIM">Ruim</option>
                      <option value="DANIFICADA">Danificada</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custos Adicionais */}
          <div className="space-y-2 p-3 sm:p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10">
            <Label htmlFor="custos" className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              Custos Adicionais (opcional)
            </Label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">R$</span>
              <Input
                id="custos"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={custosAdicionais}
                onChange={(e) => setCustosAdicionais(e.target.value)}
                className="font-mono text-right w-full sm:flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Custos não planejados que surgiram durante a execução
            </p>
          </div>

          {/* Veículo */}
          {temVeiculo && (
            <div className="space-y-3 p-3 sm:p-4 rounded-lg border bg-muted/30">
              <Label className="text-sm font-semibold">Informações do Veículo</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="kmFinal" className="text-xs">KM Final</Label>
                  <Input
                    id="kmFinal"
                    type="number"
                    placeholder="0"
                    value={kmFinal}
                    onChange={(e) => setKmFinal(e.target.value)}
                    className="font-mono"
                  />
                  {execucao.reserva_veiculo?.km_inicial && (
                    <p className="text-xs text-muted-foreground">
                      KM Inicial: {execucao.reserva_veiculo.km_inicial}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="obsVeiculo" className="text-xs">Observações</Label>
                  <Textarea
                    id="obsVeiculo"
                    placeholder="Estado do veículo..."
                    value={observacoesVeiculo}
                    onChange={(e) => setObservacoesVeiculo(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Avaliação de Qualidade */}
          <div className="space-y-3 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-blue-600 dark:text-blue-500" />
              Avaliação de Qualidade
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              {[1, 2, 3, 4, 5].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setAvaliacao(valor)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`h-7 w-7 sm:h-8 sm:w-8 ${
                      valor <= avaliacao
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 font-semibold text-base sm:text-lg">{avaliacao}/5</span>
            </div>
            <Textarea
              placeholder="Comentários sobre a qualidade do serviço executado..."
              value={observacoesQualidade}
              onChange={(e) => setObservacoesQualidade(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="gap-2 w-full sm:w-auto"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !resultadoServico.trim() || !atividadesRealizadas.trim()}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
          >
            <CheckCircle2 className="h-4 w-4" />
            {loading ? 'Finalizando...' : 'Finalizar Execução'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
