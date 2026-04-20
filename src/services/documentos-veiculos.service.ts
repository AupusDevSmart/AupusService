// src/services/documentos-veiculos.service.ts
import { api } from '@/config/api';
import {
  DocumentoVeiculoResponse,
  UploadDocumentoDto,
  validarTipoArquivo,
  validarTamanhoArquivo,
  TAMANHO_MAXIMO_DOCUMENTO,
  TIPOS_DOCUMENTOS_PERMITIDOS
} from '@/features/veiculos/types/documentos';

export interface DocumentosListResponse {
  data: DocumentoVeiculoResponse[];
}

class DocumentosVeiculosApiService {
  private baseUrl = '/veiculos';

  // ==========================================
  // 🔵 VALIDAÇÕES LOCAIS
  // ==========================================

  private validarArquivo(file: File): void {
    if (!file) {
      throw new Error('Arquivo é obrigatório');
    }

    // Validar tipo
    if (!validarTipoArquivo(file.name)) {
      throw new Error(`Tipo de arquivo não permitido. Permitidos: ${TIPOS_DOCUMENTOS_PERMITIDOS.join(', ')}`);
    }

    // Validar tamanho
    if (!validarTamanhoArquivo(file.size)) {
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${Math.round(TAMANHO_MAXIMO_DOCUMENTO / (1024 * 1024))}MB`);
    }
  }

  // ==========================================
  // 🔵 OPERAÇÕES DE UPLOAD
  // ==========================================

  async uploadDocumento(
    veiculoId: number,
    uploadData: UploadDocumentoDto,
    onProgress?: (progress: number) => void
  ): Promise<DocumentoVeiculoResponse> {
    // console.log('📎 [DocumentosVeiculosService] Iniciando upload:', uploadData.file.name);

    // Validar arquivo localmente antes de enviar
    this.validarArquivo(uploadData.file);

    // Primeiro criar a documentação
    const documentacaoData = {
      tipo: uploadData.categoria,
      descricao: uploadData.descricao || `${uploadData.file.name}`,
      dataVencimento: uploadData.dataVencimento || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // Default: 1 ano
      numeroDocumento: '',
      orgaoEmissor: '',
      observacoes: ''
    };

    try {
      // 1. Criar documentação
      const documentacaoResponse = await api.post(
        `${this.baseUrl}/${veiculoId}/documentacao`,
        documentacaoData
      );

      const documentacaoId = documentacaoResponse.data.id;

      // 2. Upload do arquivo
      const formData = new FormData();
      formData.append('file', uploadData.file);

      await api.post(
        `${this.baseUrl}/${veiculoId}/documentacao/${documentacaoId}/upload`,
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

      // console.log('✅ [DocumentosVeiculosService] Upload concluído:', uploadResponse.data);
      return {
        ...documentacaoResponse.data,
        nome_original: uploadData.file.name,
        nome_arquivo: uploadData.file.name,
        tipo: uploadData.file.type,
        tamanho: uploadData.file.size
      };
    } catch (error) {
      // console.error('❌ [DocumentosVeiculosService] Erro no upload:', error);
      throw error;
    }
  }

  // ==========================================
  // 🔵 LISTAGEM E CONSULTA
  // ==========================================

  async listarDocumentos(veiculoId: number): Promise<DocumentoVeiculoResponse[]> {
    // console.log('📋 [DocumentosVeiculosService] Listando documentos do veículo:', veiculoId);

    try {
      const response = await api.get<DocumentosListResponse>(`${this.baseUrl}/${veiculoId}/documentacao`);
      // console.log('📋 [DocumentosVeiculosService] Documentos encontrados:', response.data.data?.length || 0);

      // API pode retornar array direto ou dentro de 'data'
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    } catch (error) {
      // console.error('❌ [DocumentosVeiculosService] Erro ao listar documentos:', error);
      return []; // Retornar array vazio em caso de erro
    }
  }

  async obterDocumento(documentoId: string): Promise<DocumentoVeiculoResponse> {
    // console.log('📄 [DocumentosVeiculosService] Buscando documento:', documentoId);

    const response = await api.get(`${this.baseUrl}/documentos/${documentoId}`);
    // console.log('📄 [DocumentosVeiculosService] Documento encontrado:', response.data);

    return response.data;
  }

  // ==========================================
  // 🔵 DOWNLOAD
  // ==========================================

  async downloadDocumento(veiculoId: number, documentoId: string): Promise<void> {
    // console.log('⬇️ [DocumentosVeiculosService] Iniciando download:', { veiculoId, documentoId });

    try {
      const response = await api.get(`${this.baseUrl}/${veiculoId}/documentacao/${documentoId}/download`, {
        responseType: 'blob',
      });

      // 🔍 DEBUG: Log detalhado do response
      // console.log('📊 [DocumentosVeiculosService] Response headers:', response.headers);
      // console.log('📊 [DocumentosVeiculosService] Content-Type:', response.headers['content-type']);
      // console.log('📊 [DocumentosVeiculosService] Content-Length:', response.headers['content-length']);
      // console.log('📊 [DocumentosVeiculosService] Blob type:', response.data.type);
      // console.log('📊 [DocumentosVeiculosService] Blob size:', response.data.size);

      // Extrair nome do arquivo do header Content-Disposition
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `documento-${documentoId}`;

      // console.log('📄 [DocumentosVeiculosService] Content-Disposition:', contentDisposition);

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/['"]/g, '');
        }
      }

      // Verificar se o arquivo é realmente um PDF
      const contentType = response.headers['content-type'];

      // 🔧 FIX: Backend retorna "pdf" mas deveria ser "application/pdf"
      const isActuallyPdf = contentType && (
        contentType.includes('application/pdf') ||
        contentType === 'pdf' ||
        contentType.includes('pdf')
      );

      // console.log('🔍 [DocumentosVeiculosService] Arquivo detectado como PDF?', isActuallyPdf);

      // 🔧 FIX: Garantir que PDFs tenham extensão .pdf
      if (isActuallyPdf && !fileName.toLowerCase().endsWith('.pdf')) {
        fileName = fileName + '.pdf';
        // console.log('🔧 [DocumentosVeiculosService] Adicionada extensão .pdf:', fileName);
      }

      // Criar blob com o content-type correto
      const correctMimeType = isActuallyPdf ? 'application/pdf' : (contentType || 'application/octet-stream');
      const blob = new Blob([response.data], {
        type: correctMimeType
      });

      // Criar URL temporária e fazer download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;

      // console.log('⬇️ [DocumentosVeiculosService] Download iniciado:', fileName);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // console.log('✅ [DocumentosVeiculosService] Download concluído:', fileName);
    } catch (error) {
      // console.error('❌ [DocumentosVeiculosService] Erro no download:', error);
      throw error;
    }
  }

  // ==========================================
  // 🔵 REMOÇÃO
  // ==========================================

  async removerDocumento(veiculoId: number, documentoId: string): Promise<{ message: string }> {
    // console.log('🗑️ [DocumentosVeiculosService] Removendo documento:', { veiculoId, documentoId });

    const response = await api.delete(`${this.baseUrl}/${veiculoId}/documentacao/${documentoId}`);
    // console.log('✅ [DocumentosVeiculosService] Documento removido:', response.data);

    return response.data;
  }

  // ==========================================
  // 🔵 UTILITÁRIOS
  // ==========================================

  gerarUrlDownload(documentoId: string): string {
    return `${api.defaults.baseURL}${this.baseUrl}/documentos/${documentoId}/download`;
  }

  async testarConexao(): Promise<boolean> {
    try {
      // console.log('🧪 [DocumentosVeiculosService] Testando conexão...');

      // Fazer uma chamada simples para testar conectividade
      await api.get(`${this.baseUrl}/test-connection-documentos`);

      // console.log('✅ [DocumentosVeiculosService] Conexão OK');
      return true;
    } catch (error) {
      // console.error('❌ [DocumentosVeiculosService] Erro na conexão:', error);
      return false;
    }
  }
}

// Instância singleton
export const documentosVeiculosService = new DocumentosVeiculosApiService();
export default documentosVeiculosService;