// src/services/anexos-anomalias.service.ts
import { api } from '@/config/api';
import { 
  AnexoAnomaliaResponse, 
  UploadAnexoDto,
  validarTipoArquivo,
  validarTamanhoArquivo,
  TAMANHO_MAXIMO_ANEXO,
  TIPOS_ANEXOS_PERMITIDOS
} from '@/features/anomalias/types/anexos';

export interface AnexosListResponse {
  data: AnexoAnomaliaResponse[];
}

class AnexosAnomaliasApiService {
  private baseUrl = '/anomalias';

  // ==========================================
  // 🔵 VALIDAÇÕES LOCAIS
  // ==========================================

  private validarArquivo(file: File): void {
    if (!file) {
      throw new Error('Arquivo é obrigatório');
    }

    // Validar tipo
    if (!validarTipoArquivo(file.name)) {
      throw new Error(`Tipo de arquivo não permitido. Permitidos: ${TIPOS_ANEXOS_PERMITIDOS.join(', ')}`);
    }

    // Validar tamanho
    if (!validarTamanhoArquivo(file.size)) {
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${Math.round(TAMANHO_MAXIMO_ANEXO / (1024 * 1024))}MB`);
    }
  }

  // ==========================================
  // 🔵 OPERAÇÕES DE UPLOAD
  // ==========================================

  async uploadAnexo(
    anomaliaId: string, 
    file: File, 
    descricao?: string,
    onProgress?: (progress: number) => void
  ): Promise<AnexoAnomaliaResponse> {
    // console.log('📎 [AnexosService] Iniciando upload:', file.name);

    // Validar arquivo localmente antes de enviar
    this.validarArquivo(file);

    // Criar FormData
    const formData = new FormData();
    formData.append('file', file);
    if (descricao) {
      formData.append('descricao', descricao);
    }

    try {
      const response = await api.post(
        `${this.baseUrl}/${anomaliaId}/anexos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(progress);
            }
          },
        }
      );

      // console.log('✅ [AnexosService] Upload concluído:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [AnexosService] Erro no upload:', error);
      throw error;
    }
  }

  // ==========================================
  // 🔵 LISTAGEM E CONSULTA
  // ==========================================

  async listarAnexos(anomaliaId: string): Promise<AnexoAnomaliaResponse[]> {
    // console.log('📋 [AnexosService] Listando anexos da anomalia:', anomaliaId);

    try {
      const response = await api.get<AnexosListResponse>(`${this.baseUrl}/${anomaliaId}/anexos`);
      // console.log('📋 [AnexosService] Anexos encontrados:', response.data.data?.length || 0);
      
      // API pode retornar array direto ou dentro de 'data'
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    } catch (error) {
      // console.error('❌ [AnexosService] Erro ao listar anexos:', error);
      return []; // Retornar array vazio em caso de erro
    }
  }

  async obterAnexo(anexoId: string): Promise<AnexoAnomaliaResponse> {
    // console.log('📄 [AnexosService] Buscando anexo:', anexoId);

    const response = await api.get(`/anomalias/anexos/${anexoId}`);
    // console.log('📄 [AnexosService] Anexo encontrado:', response.data);

    return response.data;
  }

  // ==========================================
  // 🔵 DOWNLOAD
  // ==========================================

  async downloadAnexo(anexoId: string): Promise<void> {
    // console.log('⬇️ [AnexosService] Iniciando download:', anexoId);

    try {
      const response = await api.get(`/anomalias/anexos/${anexoId}/download`, {
        responseType: 'blob',
      });

      // Extrair nome do arquivo do header Content-Disposition
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `anexo-${anexoId}`;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/['"]/g, '');
        }
      }

      // Criar URL temporária e fazer download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // console.log('✅ [AnexosService] Download concluído:', fileName);
    } catch (error) {
      // console.error('❌ [AnexosService] Erro no download:', error);
      throw error;
    }
  }

  // ==========================================
  // 🔵 REMOÇÃO
  // ==========================================

  async removerAnexo(anexoId: string): Promise<{ message: string }> {
    // console.log('🗑️ [AnexosService] Removendo anexo:', anexoId);

    const response = await api.delete(`/anomalias/anexos/${anexoId}`);
    // console.log('✅ [AnexosService] Anexo removido:', response.data);

    return response.data;
  }

  // ==========================================
  // 🔵 UTILITÁRIOS
  // ==========================================

  gerarUrlDownload(anexoId: string): string {
    return `${api.defaults.baseURL}/anomalias/anexos/${anexoId}/download`;
  }

  async testarConexao(): Promise<boolean> {
    try {
      // console.log('🧪 [AnexosService] Testando conexão...');
      
      // Fazer uma chamada simples para testar conectividade
      // Como não temos um endpoint específico, vamos usar o de listar de uma anomalia inexistente
      await api.get(`${this.baseUrl}/test-connection-anexos`);
      
      // console.log('✅ [AnexosService] Conexão OK');
      return true;
    } catch (error) {
      // console.error('❌ [AnexosService] Erro na conexão:', error);
      return false;
    }
  }
}

// Instância singleton
export const anexosAnomaliasService = new AnexosAnomaliasApiService();
export default anexosAnomaliasService;