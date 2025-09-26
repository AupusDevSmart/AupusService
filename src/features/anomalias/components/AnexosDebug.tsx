// src/features/anomalias/components/AnexosDebug.tsx - COMPONENTE DE DEBUG
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAnexosAnomalias } from '../hooks/useAnexosAnomalias';
import { anexosAnomaliasService } from '@/services/anexos-anomalias.service';
import { Loader2, Bug, CheckCircle, XCircle } from 'lucide-react';

interface AnexosDebugProps {
  anomaliaId?: string;
}

export const AnexosDebug = ({ anomaliaId }: AnexosDebugProps) => {
  const [testResults, setTestResults] = useState<any>({});
  const [testing, setTesting] = useState(false);
  
  const { 
    anexos, 
    loading, 
    error, 
    listarAnexos 
  } = useAnexosAnomalias();

  const runTests = async () => {
    setTesting(true);
    const results: any = {};
    
    try {
      // Test 1: Verificar anomaliaId
      console.log('🧪 TEST 1: Verificando anomaliaId');
      results.anomaliaId = {
        original: anomaliaId,
        cleaned: anomaliaId?.toString().trim(),
        length: anomaliaId?.length,
        cleanedLength: anomaliaId?.toString().trim().length,
        hasSpaces: anomaliaId !== anomaliaId?.toString().trim(),
        isEmpty: !anomaliaId?.toString().trim(),
        status: anomaliaId?.toString().trim() ? 'OK' : 'ERRO'
      };
      
      // Test 2: Testar chamada direta do service
      console.log('🧪 TEST 2: Chamada direta do service');
      try {
        const serviceResult = await anexosAnomaliasService.listarAnexos(anomaliaId?.toString().trim() || '');
        results.serviceCall = {
          success: true,
          data: serviceResult,
          count: serviceResult?.length || 0,
          status: 'OK'
        };
        console.log('✅ Service call success:', serviceResult);
      } catch (serviceError: any) {
        results.serviceCall = {
          success: false,
          error: serviceError.message,
          status: serviceError.response?.status || 'NETWORK_ERROR',
          response: serviceError.response?.data
        };
        console.error('❌ Service call failed:', serviceError);
      }
      
      // Test 3: Testar hook
      console.log('🧪 TEST 3: Testando hook');
      try {
        await listarAnexos(anomaliaId?.toString().trim() || '');
        results.hookCall = {
          success: true,
          anexosCount: anexos.length,
          hasError: !!error,
          errorMessage: error,
          status: 'OK'
        };
      } catch (hookError: any) {
        results.hookCall = {
          success: false,
          error: hookError.message,
          status: 'ERRO'
        };
      }

      // Test 4: Informações da API
      console.log('🧪 TEST 4: Verificando configuração da API');
      results.apiConfig = {
        baseURL: (window as any).__API_BASE_URL__ || 'not set',
        endpoint: `/anomalias/${anomaliaId?.toString().trim()}/anexos`,
        fullUrl: `${(window as any).__API_BASE_URL__ || 'http://localhost:3001/api'}/anomalias/${anomaliaId?.toString().trim()}/anexos`
      };

      setTestResults(results);
      
    } catch (error) {
      console.error('❌ Error in tests:', error);
      results.generalError = error;
      setTestResults(results);
    } finally {
      setTesting(false);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'OK') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'ERRO') return <XCircle className="h-4 w-4 text-red-500" />;
    return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
  };

  return (
    <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Bug className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-orange-800">Debug Anexos</h3>
      </div>
      
      {/* Botão de teste */}
      <Button 
        onClick={runTests} 
        disabled={testing}
        className="mb-4"
        variant="outline"
      >
        {testing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Executando Testes...
          </>
        ) : (
          'Executar Diagnóstico'
        )}
      </Button>

      {/* Informações básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold text-sm mb-2">Estado Atual do Hook</h4>
          <div className="text-xs space-y-1">
            <div>Loading: <span className={loading ? 'text-orange-600' : 'text-green-600'}>{loading ? 'SIM' : 'NÃO'}</span></div>
            <div>Anexos: <span className="text-blue-600">{anexos.length}</span></div>
            <div>Erro: <span className={error ? 'text-red-600' : 'text-green-600'}>{error || 'Nenhum'}</span></div>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold text-sm mb-2">AnomaliaId</h4>
          <div className="text-xs space-y-1">
            <div>Original: <code>"{anomaliaId}"</code></div>
            <div>Length: <span className="text-blue-600">{anomaliaId?.length || 0}</span></div>
            <div>Tem espaços: <span className={anomaliaId !== anomaliaId?.toString().trim() ? 'text-red-600' : 'text-green-600'}>
              {anomaliaId !== anomaliaId?.toString().trim() ? 'SIM' : 'NÃO'}
            </span></div>
          </div>
        </div>
      </div>

      {/* Resultados dos testes */}
      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Resultados do Diagnóstico:</h4>
          
          {/* Test 1: AnomaliaId */}
          {testResults.anomaliaId && (
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon status={testResults.anomaliaId.status} />
                <h5 className="font-semibold text-sm">1. Verificação AnomaliaId</h5>
              </div>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(testResults.anomaliaId, null, 2)}
              </pre>
            </div>
          )}

          {/* Test 2: Service Call */}
          {testResults.serviceCall && (
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon status={testResults.serviceCall.success ? 'OK' : 'ERRO'} />
                <h5 className="font-semibold text-sm">2. Chamada Direta do Service</h5>
              </div>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(testResults.serviceCall, null, 2)}
              </pre>
            </div>
          )}

          {/* Test 3: Hook Call */}
          {testResults.hookCall && (
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon status={testResults.hookCall.success ? 'OK' : 'ERRO'} />
                <h5 className="font-semibold text-sm">3. Teste do Hook</h5>
              </div>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(testResults.hookCall, null, 2)}
              </pre>
            </div>
          )}

          {/* Test 4: API Config */}
          {testResults.apiConfig && (
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center gap-2 mb-2">
                <Bug className="h-4 w-4 text-blue-500" />
                <h5 className="font-semibold text-sm">4. Configuração da API</h5>
              </div>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(testResults.apiConfig, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Lista atual de anexos */}
      {anexos.length > 0 && (
        <div className="mt-4 bg-white p-3 rounded border">
          <h4 className="font-semibold text-sm mb-2">Anexos Carregados ({anexos.length}):</h4>
          <div className="space-y-2">
            {anexos.map((anexo, index) => (
              <div key={anexo.id} className="text-xs bg-gray-50 p-2 rounded">
                <div><strong>#{index + 1}</strong></div>
                <div><strong>ID:</strong> "{anexo.id}"</div>
                <div><strong>Nome:</strong> {anexo.nome_original}</div>
                <div><strong>AnomaliaId:</strong> "{anexo.anomalia_id}"</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};