// src/hooks/useEstadosIBGE.ts - VERSÃO COMPLETA COM CEP
import { useState, useEffect } from 'react';

interface Estado {
  id: number;
  sigla: string;
  nome: string;
  regiao: {
    id: number;
    sigla: string;
    nome: string;
  };
}

interface Cidade {
  id: number;
  nome: string;
  microrregiao: {
    id: number;
    nome: string;
    mesorregiao: {
      id: number;
      nome: string;
      UF: {
        id: number;
        sigla: string;
        nome: string;
      };
    };
  };
}

// Estrutura de resposta da API ViaCEP
interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // cidade
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface EstadoOption {
  value: string;
  label: string;
}

export interface CidadeOption {
  value: string;
  label: string;
}

export interface EnderecoCompleto {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  complemento?: string;
}

// Dados estáticos como fallback
const ESTADOS_FALLBACK: EstadoOption[] = [
  { value: 'AC', label: 'Acre (AC)' },
  { value: 'AL', label: 'Alagoas (AL)' },
  { value: 'AP', label: 'Amapá (AP)' },
  { value: 'AM', label: 'Amazonas (AM)' },
  { value: 'BA', label: 'Bahia (BA)' },
  { value: 'CE', label: 'Ceará (CE)' },
  { value: 'DF', label: 'Distrito Federal (DF)' },
  { value: 'ES', label: 'Espírito Santo (ES)' },
  { value: 'GO', label: 'Goiás (GO)' },
  { value: 'MA', label: 'Maranhão (MA)' },
  { value: 'MT', label: 'Mato Grosso (MT)' },
  { value: 'MS', label: 'Mato Grosso do Sul (MS)' },
  { value: 'MG', label: 'Minas Gerais (MG)' },
  { value: 'PA', label: 'Pará (PA)' },
  { value: 'PB', label: 'Paraíba (PB)' },
  { value: 'PR', label: 'Paraná (PR)' },
  { value: 'PE', label: 'Pernambuco (PE)' },
  { value: 'PI', label: 'Piauí (PI)' },
  { value: 'RJ', label: 'Rio de Janeiro (RJ)' },
  { value: 'RN', label: 'Rio Grande do Norte (RN)' },
  { value: 'RS', label: 'Rio Grande do Sul (RS)' },
  { value: 'RO', label: 'Rondônia (RO)' },
  { value: 'RR', label: 'Roraima (RR)' },
  { value: 'SC', label: 'Santa Catarina (SC)' },
  { value: 'SP', label: 'São Paulo (SP)' },
  { value: 'SE', label: 'Sergipe (SE)' },
  { value: 'TO', label: 'Tocantins (TO)' }
];

// Cache com TTL (Time To Live)
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number; // em milissegundos
}

const cache = new Map<string, CacheItem>();

// Função para verificar se item do cache ainda é válido
const isValidCache = (cacheKey: string): boolean => {
  const item = cache.get(cacheKey);
  if (!item) return false;
  
  const now = Date.now();
  return (now - item.timestamp) < item.ttl;
};

// Função para salvar no cache com TTL
const setCache = (key: string, data: any, ttlMinutes: number = 30) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMinutes * 60 * 1000
  });
};

// Função para buscar do cache
const getCache = (key: string) => {
  if (isValidCache(key)) {
    return cache.get(key)?.data;
  }
  return null;
};

// Hook para buscar estados
export const useEstadosIBGE = () => {
  const [estados, setEstados] = useState<EstadoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstados = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verificar cache primeiro
        const cacheKey = 'estados-ibge';
        const cachedData = getCache(cacheKey);
        
        if (cachedData) {
          setEstados(cachedData);
          setLoading(false);
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(
          'https://servicodados.ibge.gov.br/api/v1/localidades/estados',
          {
            headers: {
              'Accept': 'application/json',
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data: Estado[] = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Dados inválidos recebidos da API');
        }

        const estadosFormatados = data
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map(estado => ({
            value: estado.sigla,
            label: `${estado.nome} (${estado.sigla})`
          }));

        setCache(cacheKey, estadosFormatados, 60); // Cache por 1 hora
        setEstados(estadosFormatados);

      } catch (err) {
        console.warn('Erro ao buscar estados do IBGE, usando fallback:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setEstados(ESTADOS_FALLBACK);
      } finally {
        setLoading(false);
      }
    };

    fetchEstados();
  }, []);

  return { estados, loading, error };
};

// Hook para buscar cidades por estado
export const useCidadesIBGE = (estadoSigla?: string) => {
  const [cidades, setCidades] = useState<CidadeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!estadoSigla) {
      setCidades([]);
      return;
    }

    const fetchCidades = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verificar cache primeiro
        const cacheKey = `cidades-${estadoSigla}`;
        const cachedData = getCache(cacheKey);
        
        if (cachedData) {
          setCidades(cachedData);
          setLoading(false);
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSigla}/municipios`,
          {
            headers: {
              'Accept': 'application/json',
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data: Cidade[] = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Dados inválidos recebidos da API');
        }

        const cidadesFormatadas = data
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map(cidade => ({
            value: cidade.nome,
            label: cidade.nome
          }));

        setCache(cacheKey, cidadesFormatadas, 120); // Cache por 2 horas
        setCidades(cidadesFormatadas);

      } catch (err) {
        console.warn(`Erro ao buscar cidades de ${estadoSigla}:`, err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        
        const cidadesFallback = getFallbackCidades(estadoSigla);
        setCidades(cidadesFallback);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchCidades, 300);
    return () => clearTimeout(timeoutId);
  }, [estadoSigla]);

  return { cidades, loading, error };
};

// Hook para buscar endereço por CEP
export const useViaCEP = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarCEP = async (cep: string): Promise<EnderecoCompleto | null> => {
    try {
      setLoading(true);
      setError(null);

      // Limpar CEP (remover caracteres não numéricos)
      const cepLimpo = cep.replace(/\D/g, '');
      
      if (cepLimpo.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }

      // Verificar cache primeiro
      const cacheKey = `cep-${cepLimpo}`;
      const cachedData = getCache(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
        {
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data: ViaCEPResponse = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      const enderecoCompleto: EnderecoCompleto = {
        cep: data.cep,
        logradouro: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        uf: data.uf,
        complemento: data.complemento
      };

      setCache(cacheKey, enderecoCompleto, 1440); // Cache por 24 horas
      return enderecoCompleto;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.warn('Erro ao buscar CEP:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { buscarCEP, loading, error };
};

// Função para fallback de cidades por estado
const getFallbackCidades = (estadoSigla: string): CidadeOption[] => {
  const cidadesPorEstado: Record<string, CidadeOption[]> = {
    'SP': [
      { value: 'São Paulo', label: 'São Paulo' },
      { value: 'Campinas', label: 'Campinas' },
      { value: 'Guarulhos', label: 'Guarulhos' },
      { value: 'São Bernardo do Campo', label: 'São Bernardo do Campo' },
      { value: 'Santo André', label: 'Santo André' },
      { value: 'Osasco', label: 'Osasco' },
      { value: 'Ribeirão Preto', label: 'Ribeirão Preto' },
      { value: 'Sorocaba', label: 'Sorocaba' }
    ],
    'RJ': [
      { value: 'Rio de Janeiro', label: 'Rio de Janeiro' },
      { value: 'Niterói', label: 'Niterói' },
      { value: 'Nova Iguaçu', label: 'Nova Iguaçu' },
      { value: 'Duque de Caxias', label: 'Duque de Caxias' },
      { value: 'São Gonçalo', label: 'São Gonçalo' },
      { value: 'Campos dos Goytacazes', label: 'Campos dos Goytacazes' }
    ],
    'MG': [
      { value: 'Belo Horizonte', label: 'Belo Horizonte' },
      { value: 'Uberlândia', label: 'Uberlândia' },
      { value: 'Contagem', label: 'Contagem' },
      { value: 'Juiz de Fora', label: 'Juiz de Fora' },
      { value: 'Betim', label: 'Betim' },
      { value: 'Montes Claros', label: 'Montes Claros' }
    ],
    'RS': [
      { value: 'Porto Alegre', label: 'Porto Alegre' },
      { value: 'Caxias do Sul', label: 'Caxias do Sul' },
      { value: 'Pelotas', label: 'Pelotas' },
      { value: 'Canoas', label: 'Canoas' },
      { value: 'Santa Maria', label: 'Santa Maria' }
    ],
    'PR': [
      { value: 'Curitiba', label: 'Curitiba' },
      { value: 'Londrina', label: 'Londrina' },
      { value: 'Maringá', label: 'Maringá' },
      { value: 'Ponta Grossa', label: 'Ponta Grossa' },
      { value: 'Cascavel', label: 'Cascavel' }
    ],
    'SC': [
      { value: 'Florianópolis', label: 'Florianópolis' },
      { value: 'Joinville', label: 'Joinville' },
      { value: 'Blumenau', label: 'Blumenau' },
      { value: 'Chapecó', label: 'Chapecó' }
    ],
    'BA': [
      { value: 'Salvador', label: 'Salvador' },
      { value: 'Feira de Santana', label: 'Feira de Santana' },
      { value: 'Vitória da Conquista', label: 'Vitória da Conquista' }
    ]
  };

  return cidadesPorEstado[estadoSigla] || [];
};

// Função para limpar cache
export const clearLocationCache = () => {
  cache.clear();
  console.log('Cache de localização limpo');
};

// Função para validar CEP
export const validarCEP = (cep: string): boolean => {
  const cepLimpo = cep.replace(/\D/g, '');
  return cepLimpo.length === 8;
};

// Função para formatar CEP
export const formatarCEP = (cep: string): string => {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length <= 5) {
    return cepLimpo;
  }
  return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5, 8)}`;
};