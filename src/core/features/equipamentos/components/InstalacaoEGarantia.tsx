import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { garantiaAntesDaInstalacao, situacaoDaGarantia } from '@/core/features/equipamentos/utils/garantia';

export type CampoDeInstalacao = 'dataInstalacao' | 'garantiaAte' | 'fornecedor' | 'centroCusto';

interface InstalacaoEGarantiaProps {
  valores: Partial<Record<CampoDeInstalacao, string | null>>;
  onChange: (campo: CampoDeInstalacao, valor: string) => void;
  somenteLeitura?: boolean;
  /** AAAA-MM-DD em Brasília; os testes fixam o dia */
  hoje?: string;
}

/**
 * Instalação, garantia, fornecedor e centro de custo do equipamento (SN-66), no
 * sheet da UC e no do componente. "Instalação" é a DATA: a instalação como lugar
 * (a unidade) já aparece no sheet e não se troca. Fornecedor e centro de custo
 * são texto (o cadastro de fornecedores está fora do roadmap).
 */
export function InstalacaoEGarantia({ valores, onChange, somenteLeitura = false, hoje }: InstalacaoEGarantiaProps) {
  const situacao = situacaoDaGarantia(valores.garantiaAte, hoje);
  const datasTrocadas = garantiaAntesDaInstalacao(valores.dataInstalacao, valores.garantiaAte);

  const campo = (chave: CampoDeInstalacao, rotulo: string, props: { type?: string; placeholder?: string; maxLength?: number } = {}) => (
    <div className="space-y-1.5">
      <label htmlFor={`instalacao-${chave}`} className="text-sm font-medium">
        {rotulo}
      </label>
      <input
        id={`instalacao-${chave}`}
        className="input-minimal"
        value={valores[chave] || ''}
        onChange={(e) => onChange(chave, e.target.value)}
        disabled={somenteLeitura}
        {...props}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="border-b pb-2 text-sm font-semibold text-foreground">Instalação e garantia</h3>
      <div className="grid-equal-cols-2 gap-x-2 gap-y-4">
        {campo('dataInstalacao', 'Data de instalação', { type: 'date' })}
        {campo('garantiaAte', 'Garantia até', { type: 'date' })}
        {campo('fornecedor', 'Fornecedor', { placeholder: 'Quem forneceu', maxLength: 255 })}
        {campo('centroCusto', 'Centro de custo', { placeholder: 'Ex: CC-001', maxLength: 100 })}
      </div>

      {situacao && (
        <p
          role={situacao.tipo === 'vigente' ? undefined : 'status'}
          className={`flex items-center gap-1.5 text-sm ${situacao.tipo === 'vencida' ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {situacao.tipo === 'vigente' ? <ShieldCheck className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {situacao.texto}
        </p>
      )}
      {datasTrocadas && (
        <p className="text-sm text-muted-foreground">A garantia termina antes da instalação: confira as duas datas.</p>
      )}
    </div>
  );
}
