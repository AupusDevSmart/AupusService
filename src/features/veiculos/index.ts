// src/features/veiculos/index.ts
export * from './types';
// Mock data removed - using API now
export { VeiculosPage } from './components/VeiculosPage';
export { ViaturaSelector } from './components/ViaturaSelector';
export { ViaturaFormField, useViaturaField } from './components/ViaturaFormField';
export { DocumentosUpload } from './components/DocumentosUpload';
export { useDocumentosVeiculos } from './hooks/useDocumentosVeiculos';

// Exemplo de uso da integração:
/*
// Em qualquer lugar da aplicação (OS, viagens, etc.)
import { ViaturaFormField, useReservasVeiculos } from '@/features/veiculos';

// Em um formulário de OS:
const FormularioOS = () => {
  const [osData, setOSData] = useState({
    id: 'OS-2025-001',
    responsavel: 'João Silva',
    dataInicio: '2025-02-15',
    dataFim: '2025-02-15',  
    horaInicio: '08:00',
    horaFim: '18:00',
    finalidade: 'Execução de OS-2025-001',
    viatura: null
  });

  const { criarReservaAutomatica } = useReservasVeiculos();

  const handleSubmit = async () => {
    // Criar OS
    // ...

    // Criar reserva automática se viatura foi selecionada
    if (osData.viatura) {
      await criarReservaAutomatica(osData.id, {
        tipo: 'ordem_servico',
        responsavel: osData.responsavel,
        viatura: osData.viatura
      });
    }
  };

  return (
    <form>
      // outros campos da OS...
      
      <ViaturaFormField
        value={osData.viatura}
        onChange={(viatura) => setOSData(prev => ({ ...prev, viatura }))}
        entity={osData} // Extrai período automaticamente
        required={false}
      />
      
      <button onClick={handleSubmit}>Salvar OS</button>
    </form>
  );
};

// Uso direto do ViaturaSelector:
const ExemploUsoDirecto = () => {
  const [viatura, setViatura] = useState(null);

  return (
    <ViaturaSelector
      value={viatura}
      onChange={setViatura}
      dataInicio="2025-02-15"
      dataFim="2025-02-15"
      horaInicio="08:00"
      horaFim="18:00"
      solicitanteId="EXEMPLO-001"
      responsavel="Usuário Teste"
      finalidade="Teste de integração"
      mode="complete"
      showPeriodSummary={true}
    />
  );
};
*/