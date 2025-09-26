// src/utils/error-handler.utils.ts
// Utilitários para extrair e mostrar erros da API de forma user-friendly

export interface ApiError {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

export interface ParsedError {
  title: string;
  message: string;
  details?: string[];
}

export class ErrorHandlerUtils {
  
  /**
   * Extrai mensagens de erro de diferentes formatos de resposta da API
   */
  static parseApiError(error: any): ParsedError {
    // Estrutura padrão
    const parsedError: ParsedError = {
      title: 'Erro',
      message: 'Ocorreu um erro inesperado'
    };

    // Se não há response, é erro de rede/conexão
    if (!error.response) {
      return {
        title: 'Erro de Conexão',
        message: 'Não foi possível conectar com o servidor. Verifique sua conexão.'
      };
    }

    const { status, data } = error.response;
    
    // Definir título baseado no status
    switch (status) {
      case 400:
        parsedError.title = 'Dados Inválidos';
        break;
      case 401:
        parsedError.title = 'Não Autorizado';
        break;
      case 403:
        parsedError.title = 'Acesso Negado';
        break;
      case 404:
        parsedError.title = 'Não Encontrado';
        break;
      case 409:
        parsedError.title = 'Conflito';
        break;
      case 422:
        parsedError.title = 'Dados Inválidos';
        break;
      case 500:
        parsedError.title = 'Erro do Servidor';
        break;
      default:
        parsedError.title = `Erro ${status}`;
    }

    // Extrair mensagem
    if (data?.message) {
      if (Array.isArray(data.message)) {
        // Múltiplas mensagens de validação
        parsedError.message = 'Verifique os dados informados:';
        parsedError.details = data.message.map(msg => this.translateValidationMessage(msg));
      } else {
        // Mensagem única
        parsedError.message = this.translateValidationMessage(data.message);
      }
    } else if (data?.error) {
      parsedError.message = data.error;
    } else if (error.message) {
      parsedError.message = error.message;
    }

    return parsedError;
  }

  /**
   * Traduz mensagens de validação técnicas para português user-friendly
   */
  private static translateValidationMessage(message: string): string {
    const translations: Record<string, string> = {
      // Campos obrigatórios
      'nome should not be empty': 'Nome é obrigatório',
      'nome must be a string': 'Nome deve ser um texto válido',
      'classificacao should not be empty': 'Classificação é obrigatória',
      'classificacao must be one of the following values: UC, UAR': 'Classificação deve ser UC ou UAR',
      'criticidade should not be empty': 'Criticidade é obrigatória',
      'criticidade must be one of the following values: 1, 2, 3, 4, 5': 'Criticidade deve ser entre 1 e 5',
      'planta_id must be a string': 'ID da planta inválido',
      'proprietario_id must be a string': 'ID do proprietário inválido',
      
      // Formatos
      'data_imobilizacao must be a valid ISO 8601 date string': 'Data de imobilização deve estar no formato válido',
      'valor_imobilizado must be a number': 'Valor imobilizado deve ser um número',
      'vida_util must be an integer number': 'Vida útil deve ser um número inteiro',
      
      // Relacionamentos
      'Planta não encontrada': 'A planta selecionada não foi encontrada',
      'Proprietário não encontrado': 'O proprietário selecionado não foi encontrado',
      'Equipamento pai não encontrado ou não é UC': 'Equipamento pai inválido',
      
      // MCPSE
      'mcpse must be a boolean value': 'MCPSE deve ser verdadeiro ou falso',
      
      // Dados técnicos
      'dados_tecnicos must be an array': 'Dados técnicos devem ser uma lista válida',
      'each value in dados_tecnicos must be an object': 'Cada dado técnico deve ser um objeto válido'
    };

    // Tentar tradução exata primeiro
    if (translations[message]) {
      return translations[message];
    }

    // Traduções por padrão/regex
    if (message.includes('should not be empty')) {
      const field = message.split(' ')[0];
      return `${field} é obrigatório`;
    }

    if (message.includes('must be a string')) {
      const field = message.split(' ')[0];
      return `${field} deve ser um texto válido`;
    }

    if (message.includes('must be a number')) {
      const field = message.split(' ')[0];
      return `${field} deve ser um número válido`;
    }

    if (message.includes('must be one of the following values')) {
      const field = message.split(' ')[0];
      return `${field} possui valor inválido`;
    }

    // Se não encontrou tradução, retorna a mensagem original
    return message;
  }

  /**
   * Mostra erro usando alert nativo (temporário)
   */
  static showAlert(error: any): void {
    const parsed = this.parseApiError(error);
    
    let alertMessage = `${parsed.title}\n\n${parsed.message}`;
    
    if (parsed.details && parsed.details.length > 0) {
      alertMessage += '\n\n' + parsed.details.map(detail => `• ${detail}`).join('\n');
    }
    
    alert(alertMessage);
  }

  /**
   * Mostra erro no console de forma organizada
   */
  static logError(error: any, context?: string): void {
    const parsed = this.parseApiError(error);
    
    console.group(`❌ ERRO ${context ? `(${context})` : ''}`);
    console.log('Título:', parsed.title);
    console.log('Mensagem:', parsed.message);
    if (parsed.details) {
      console.log('Detalhes:', parsed.details);
    }
    console.log('Erro original:', error);
    console.groupEnd();
  }

  /**
   * Retorna uma string formatada do erro para mostrar na UI
   */
  static formatErrorForUI(error: any): string {
    const parsed = this.parseApiError(error);
    
    if (parsed.details && parsed.details.length > 0) {
      return `${parsed.message}\n\n${parsed.details.join('\n')}`;
    }
    
    return parsed.message;
  }
}