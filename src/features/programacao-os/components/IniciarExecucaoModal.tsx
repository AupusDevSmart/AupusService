// src/features/programacao-os/components/IniciarExecucaoModal.tsx
import React, { useState } from 'react';
import { 
  Play, 
  Users, 
  User, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  MapPin,
  FileText,
  Truck
} from 'lucide-react';
import { OrdemServico } from '../types';
import { mockTecnicos } from '@/features/execucao-os/data/mock-data';

interface IniciarExecucaoModalProps {
  isOpen: boolean;
  os: OrdemServico | null;
  onClose: () => void;
  onConfirm: (dados: IniciarExecucaoData) => Promise<void>;
  loading?: boolean;
}

interface IniciarExecucaoData {
  equipePresente: string[];
  responsavelExecucao: string;
  observacoesInicio?: string;
}

// Componente de input melhorado
const SimpleInput = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  className = '',
  ...props 
}: any) => (
  <input
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
      bg-white dark:bg-gray-800 
      text-gray-900 dark:text-gray-100 
      placeholder-gray-500 dark:placeholder-gray-400
      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
      focus:border-blue-500 dark:focus:border-blue-400
      disabled:bg-gray-100 dark:disabled:bg-gray-700 
      disabled:text-gray-500 dark:disabled:text-gray-400
      ${className}`}
    {...props}
  />
);

const SimpleTextarea = ({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  rows = 3,
  className = '',
  ...props 
}: any) => (
  <textarea
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    rows={rows}
    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
      bg-white dark:bg-gray-800 
      text-gray-900 dark:text-gray-100 
      placeholder-gray-500 dark:placeholder-gray-400
      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
      focus:border-blue-500 dark:focus:border-blue-400
      disabled:bg-gray-100 dark:disabled:bg-gray-700 
      disabled:text-gray-500 dark:disabled:text-gray-400
      resize-vertical ${className}`}
    {...props}
  />
);

export const IniciarExecucaoModal: React.FC<IniciarExecucaoModalProps> = ({
  isOpen,
  os,
  onClose,
  onConfirm,
  loading = false
}) => {
  const [equipePresente, setEquipePresente] = useState<string[]>([]);
  const [responsavelExecucao, setResponsavelExecucao] = useState(os?.responsavel || '');
  const [observacoesInicio, setObservacoesInicio] = useState('');

  if (!isOpen || !os) return null;

  const handleEquipeChange = (tecnicoNome: string, selecionado: boolean) => {
    if (selecionado) {
      setEquipePresente(prev => [...prev, tecnicoNome]);
    } else {
      setEquipePresente(prev => prev.filter(nome => nome !== tecnicoNome));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!responsavelExecucao.trim()) {
      alert('Responsável pela execução é obrigatório');
      return;
    }

    const dados: IniciarExecucaoData = {
      equipePresente,
      responsavelExecucao: responsavelExecucao.trim(),
      observacoesInicio: observacoesInicio.trim() || undefined
    };

    await onConfirm(dados);
  };

  const handleCancel = () => {
    setEquipePresente([]);
    setResponsavelExecucao(os?.responsavel || '');
    setObservacoesInicio('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
            <Play className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Iniciar Execução
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              OS {os.numeroOS} - Configure a equipe de execução
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resumo da OS */}
            <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resumo da Ordem de Serviço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 dark:text-blue-300 font-medium">{os.descricao}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-600 dark:text-blue-400">{os.local}</span>
                  </div>
                  <p className="text-blue-600 dark:text-blue-400 mt-1">{os.ativo}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-600 dark:text-blue-400">
                      {os.dataProgramada} às {os.horaProgramada}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-600 dark:text-blue-400">
                      Responsável: {os.responsavel}
                    </span>
                  </div>
                  {os.viatura && typeof os.viatura === 'object' && (
                    <div className="flex items-center gap-2">
                      <Truck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-600 dark:text-blue-400">
                        {os.viatura.veiculo?.placa}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Responsável pela Execução */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Responsável pela Execução <span className="text-red-500">*</span>
              </label>
              <SimpleInput
                value={responsavelExecucao}
                onChange={setResponsavelExecucao}
                placeholder="Nome do responsável pela execução"
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pessoa que ficará responsável pela execução e controle da OS
              </p>
            </div>

            {/* Equipe Presente */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Equipe Presente (Opcional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mockTecnicos.map(tecnico => (
                  <label 
                    key={tecnico.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      equipePresente.includes(tecnico.nome)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={equipePresente.includes(tecnico.nome)}
                      onChange={(e) => handleEquipeChange(tecnico.nome, e.target.checked)}
                      disabled={loading}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {tecnico.nome}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {tecnico.especialidade}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Selecione os técnicos que estarão presentes na execução
              </p>
            </div>

            {/* Observações Iniciais */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Observações Iniciais
              </label>
              <SimpleTextarea
                value={observacoesInicio}
                onChange={setObservacoesInicio}
                placeholder="Observações sobre o início da execução, condições encontradas, etc..."
                disabled={loading}
                rows={3}
              />
            </div>

            {/* Checklist que será criado */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Checklist Inicial (será criado automaticamente)
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded"></div>
                  <span>Preparar ferramentas e materiais</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded"></div>
                  <span>Executar procedimento principal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded"></div>
                  <span>Testar funcionamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded"></div>
                  <span>Documentar resultados</span>
                </div>
              </div>
            </div>

            {/* Alert */}
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100">
                    Atenção!
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Ao iniciar a execução, a OS será transferida para a tela de "Execução de OS" 
                    e o status será alterado para "EM_EXECUCAO". Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !responsavelExecucao.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 rounded-lg flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Iniciando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Iniciar Execução
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};