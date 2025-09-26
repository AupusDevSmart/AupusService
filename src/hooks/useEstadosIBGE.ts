// src/hooks/useEstadosIBGE.ts - CORRIGIDO
import { useState, useEffect } from 'react';

// ✅ NOVA: Função utilitária para fetch com timeout
async function fetchWithTimeout(url: string, options: { timeout?: number } = {}): Promise<Response> {
  const { timeout = 8000 } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      ...options
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export interface Estado {
  value: string;
  label: string;
  nome: string;
  sigla: string;
}

export interface Cidade {
  value: string;
  label: string;
  nome: string;
  codigo: string;
}

export interface EnderecoViaCEP {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

// ✅ HOOK: Estados do IBGE
export function useEstadosIBGE() {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstados = async () => {
      try {
        setLoading(true);
        // console.log('📍 [IBGE] Carregando estados...');
        
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
        
        if (!response.ok) {
          throw new Error(`Erro na API do IBGE: ${response.status}`);
        }
        
        const data = await response.json();
        
        const estadosFormatados: Estado[] = data
          .map((estado: any) => ({
            value: estado.sigla,
            label: `${estado.nome} (${estado.sigla})`,
            nome: estado.nome,
            sigla: estado.sigla,
          }))
          .sort((a: Estado, b: Estado) => a.nome.localeCompare(b.nome));

        setEstados(estadosFormatados);
        // console.log('✅ [IBGE] Estados carregados:', estadosFormatados.length);
        
      } catch (err: any) {
        // console.error('❌ [IBGE] Erro ao carregar estados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEstados();
  }, []);

  return { estados, loading, error };
}

// ✅ HOOK: Cidades por UF - COM RETRY E FALLBACK
export function useCidadesIBGE(uf: string) {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ CORREÇÃO: Limpar cidades quando UF muda
    setCidades([]);
    setError(null);

    if (!uf || uf.trim() === '') {
      // console.log('📍 [IBGE] UF vazio, não carregando cidades');
      return;
    }

    const fetchCidades = async () => {
      try {
        setLoading(true);
        // console.log(`📍 [IBGE] Carregando cidades de ${uf}...`);
        
        // ✅ SIMPLIFICADO: Usar função utilitária
        let data = null;
        let lastError = null;

        // Tentativa 1: API IBGE principal
        try {
          // console.log(`🔄 [IBGE] Tentativa 1 - API principal...`);
          
          const response = await fetchWithTimeout(
            `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
            { timeout: 8000 }
          );
          
          if (response.ok) {
            data = await response.json();
            // console.log(`✅ [IBGE] API principal funcionou!`);
          }
        } catch (err: any) {
          lastError = err;
          // console.log(`⚠️ [IBGE] API principal falhou:`, err.message);
        }

        // Tentativa 2: API alternativa (Brasil API)
        if (!data) {
          try {
            // console.log(`🔄 [IBGE] Tentativa 2 - API Brasil API...`);
            
            const response = await fetchWithTimeout(
              `https://brasilapi.com.br/api/ibge/municipios/v1/${uf}`,
              { timeout: 5000 }
            );
            
            if (response.ok) {
              const brasilApiData = await response.json();
              // Converter formato da Brasil API para nosso formato
              data = brasilApiData.map((cidade: any) => ({
                id: cidade.codigo_ibge,
                nome: cidade.nome
              }));
              // console.log(`✅ [IBGE] API Brasil API funcionou!`);
            }
          } catch (err: any) {
            lastError = err;
            // console.log(`⚠️ [IBGE] API Brasil API falhou:`, err.message);
          }
        }

        // Tentativa 3: Fallback com cidades principais do estado
        if (!data) {
          // console.log(`🔄 [IBGE] Tentativa 3 - Fallback com cidades principais...`);
          data = getFallbackCidades(uf);
          if (data.length > 0) {
            // console.log(`✅ [IBGE] Usando fallback com ${data.length} cidades principais`);
          }
        }

        // Se ainda não tem dados, lançar erro
        if (!data || data.length === 0) {
          throw lastError || new Error(`Não foi possível carregar cidades de ${uf}`);
        }
        
        const cidadesFormatadas: Cidade[] = data
          .map((cidade: any) => ({
            value: cidade.nome,
            label: cidade.nome,
            nome: cidade.nome,
            codigo: cidade.id ? cidade.id.toString() : '0',
          }))
          .sort((a: Cidade, b: Cidade) => a.nome.localeCompare(b.nome));

        setCidades(cidadesFormatadas);
        // console.log(`✅ [IBGE] Cidades de ${uf} carregadas:`, cidadesFormatadas.length);
        
      } catch (err: any) {
        // console.error(`❌ [IBGE] Erro final ao carregar cidades de ${uf}:`, err);
        setError(`Erro ao carregar cidades de ${uf}. Tente novamente.`);
        
        // ✅ FALLBACK: Usar lista básica mesmo em caso de erro
        const fallbackCidades = getFallbackCidades(uf);
        if (fallbackCidades.length > 0) {
          // console.log(`🔄 [IBGE] Usando fallback após erro: ${fallbackCidades.length} cidades`);
          const cidadesFormatadas = fallbackCidades.map((cidade: any) => ({
            value: cidade.nome,
            label: cidade.nome,
            nome: cidade.nome,
            codigo: '0',
          }));
          setCidades(cidadesFormatadas);
          setError(null); // Limpar erro já que conseguimos carregar algo
        } else {
          setCidades([]);
        }
      } finally {
        setLoading(false);
      }
    };

    // ✅ CORREÇÃO: Delay maior para evitar muitas chamadas
    const timeoutId = setTimeout(fetchCidades, 300);
    
    return () => clearTimeout(timeoutId);
  }, [uf]);

  return { cidades, loading, error };
}

// ✅ NOVA FUNÇÃO: Fallback com cidades principais por estado
function getFallbackCidades(uf: string): { nome: string; id?: string }[] {
  const cidadesPorEstado: Record<string, string[]> = {
    'AC': ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá'],
    'AL': ['Maceió', 'Arapiraca', 'Palmeira dos Índios', 'Rio Largo'],
    'AP': ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque'],
    'AM': ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru'],
    'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna', 'Juazeiro'],
    'CE': ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral'],
    'DF': ['Brasília', 'Taguatinga', 'Ceilândia', 'Samambaia'],
    'ES': ['Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Linhares'],
    'GO': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia', 'Águas Lindas de Goiás'],
    'MA': ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias'],
    'MT': ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra'],
    'MS': ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã'],
    'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros'],
    'PA': ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas'],
    'PB': ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux'],
    'PR': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais'],
    'PE': ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Bandeira', 'Caruaru', 'Petrolina'],
    'PI': ['Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano'],
    'RJ': ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Campos dos Goytacazes'],
    'RN': ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba'],
    'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria', 'Gravataí'],
    'RO': ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal'],
    'RR': ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Alto Alegre'],
    'SC': ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma', 'Chapecó'],
    'SP': ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Osasco', 'Sorocaba'],
    'SE': ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'Estância'],
    'TO': ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins']
  };

  const cidades = cidadesPorEstado[uf] || [];
  return cidades.map(nome => ({ nome }));
}

// ✅ HOOK: ViaCEP - MELHORADO COM BUSCA DE CIDADE
export function useViaCEP() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarCEP = async (cep: string): Promise<EnderecoViaCEP | null> => {
    if (!validarCEP(cep)) {
      setError('CEP inválido');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const cepLimpo = cep.replace(/\D/g, '');
      // console.log(`📍 [VIA CEP] Buscando CEP: ${cepLimpo}`);
      
      // ✅ SIMPLIFICADO: Usar função utilitária
      const response = await fetchWithTimeout(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
        { timeout: 10000 }
      );
      
      if (!response.ok) {
        throw new Error(`Erro na API ViaCEP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      // ✅ MELHORADO: Retornar dados padronizados
      const endereco: EnderecoViaCEP = {
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '', // ✅ localidade = cidade
        uf: data.uf || '',
        cep: formatarCEP(cepLimpo),
      };
      
      // console.log('✅ [VIA CEP] Endereço encontrado:', endereco);
      return endereco;
      
    } catch (err: any) {
      // console.error('❌ [VIA CEP] Erro ao buscar CEP:', err);
      
      // ✅ MELHOR: Mensagem de erro mais específica
      if (err.name === 'AbortError') {
        setError('Timeout na busca do CEP. Tente novamente.');
      } else if (err.message === 'CEP não encontrado') {
        setError('CEP não encontrado. Verifique se está correto.');
      } else {
        setError('Erro ao buscar CEP. Verifique sua conexão.');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { buscarCEP, loading, error };
}

// ✅ UTILITÁRIOS
export function formatarCEP(cep: string): string {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length === 8) {
    return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
  }
  return cep;
}

export function validarCEP(cep: string): boolean {
  const cepLimpo = cep.replace(/\D/g, '');
  return cepLimpo.length === 8 && /^\d{8}$/.test(cepLimpo);
}

// ✅ NOVO: Hook combinado para busca inteligente por CEP
export function useEnderecoInteligente() {
  const { estados } = useEstadosIBGE();
  const { buscarCEP, loading: loadingCEP, error: errorCEP } = useViaCEP();
  
  const [ufSelecionada, setUfSelecionada] = useState<string>('');
  const { cidades, loading: loadingCidades } = useCidadesIBGE(ufSelecionada);

  const buscarEnderecoCompleto = async (cep: string) => {
    // console.log('🔍 [ENDERECO INTELIGENTE] Iniciando busca por CEP:', cep);
    
    const endereco = await buscarCEP(cep);
    
    if (endereco) {
      // ✅ AUTOMATICAMENTE: Definir UF para carregar cidades
      // console.log(`📍 [ENDERECO INTELIGENTE] UF encontrada: ${endereco.uf}`);
      setUfSelecionada(endereco.uf);
      
      // ✅ AGUARDAR: Um momento para as cidades carregarem
      setTimeout(() => {
        // console.log(`✅ [ENDERECO INTELIGENTE] Endereço completo processado`);
      }, 500);
    }
    
    return endereco;
  };

  return {
    // Estados
    estados,
    
    // Cidades
    cidades,
    loadingCidades,
    ufSelecionada,
    setUfSelecionada,
    
    // CEP
    buscarEnderecoCompleto,
    loadingCEP,
    errorCEP,
    
    // Utilitários
    formatarCEP,
    validarCEP,
  };
}