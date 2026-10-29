// src/features/solicitacoes-servico/components/PlanejamentoDaProposta.tsx
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { DicaDaConta, type Explicacao } from '@/components/common/ComoSeCalcula';
import { lerNumeroDigitado } from '@/utils/leitura';
import type { PlanejamentoDaProposta as Planejamento, Proposta } from '@/services/proposta.services';

/** Pessoas e noites são inteiros: "2,5 pessoas" vira 3 (o servidor recusaria) */
const lerInteiro = (texto: string) => {
  const valor = lerNumeroDigitado(texto);
  return valor === null || valor === undefined ? valor : Math.round(valor);
};

interface PlanejamentoDaPropostaProps {
  proposta: Proposta;
  editavel: boolean;
  onChange: (dados: Partial<Planejamento>) => void;
  explicacao?: Explicacao;
}

/**
 * O planejamento da proposta (29/out/2026): o km e os números que as tabelas e a
 * programação usam. Só o que a conta pede — equipe, reserva e km de verdade são
 * da programação e da execução. Os dias sugeridos são as horas dos passos das
 * instruções em jornadas de 8 h (sem inventar simultaneidade); a pessoa ajusta.
 */
export function PlanejamentoDaProposta({ proposta, editavel, onChange, explicacao }: PlanejamentoDaPropostaProps) {
  const trocarDistancia = (km: number | null) => {
    // A ida e volta acompanha o dobro enquanto ninguém a mudou à mão
    const idaVoltaSegue = proposta.distancia_ida_volta_km === null || proposta.distancia_ida_volta_km === (proposta.distancia_km ?? 0) * 2;
    onChange({ distancia_km: km, ...(idaVoltaSegue && { distancia_ida_volta_km: km === null ? null : Math.round(km * 2 * 100) / 100 }) });
  };

  const campos: { rotulo: string; valor: number | null; onChange: (v: number | null) => void; inteiro?: boolean; placeholder?: string }[] = [
    { rotulo: 'Distância (km, ida)', valor: proposta.distancia_km, onChange: trocarDistancia },
    { rotulo: 'Ida e volta (km)', valor: proposta.distancia_ida_volta_km, onChange: (v) => onChange({ distancia_ida_volta_km: v }) },
    {
      rotulo: 'Dias previstos',
      valor: proposta.dias_previstos,
      onChange: (v) => onChange({ dias_previstos: v }),
      placeholder: proposta.dias_sugeridos ? String(proposta.dias_sugeridos) : undefined,
    },
    { rotulo: 'Pessoas', valor: proposta.pessoas_previstas, onChange: (v) => onChange({ pessoas_previstas: v }), inteiro: true },
    { rotulo: 'Noites fora', valor: proposta.noites_fora, onChange: (v) => onChange({ noites_fora: v }), inteiro: true },
  ];

  return (
    <div className="space-y-2">
      <span className="flex items-center gap-1.5 text-sm font-medium">
        Planejamento
        {explicacao && <DicaDaConta {...explicacao} />}
      </span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {campos.map(({ rotulo, valor, onChange: trocar, inteiro, placeholder }) => (
          <label key={rotulo} className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {rotulo}
            <CampoDeNumero
              className="h-8 text-right"
              value={valor}
              disabled={!editavel}
              onChange={trocar}
              placeholder={placeholder}
              avisoCurto
              {...(inteiro && { ler: lerInteiro, aviso: 'Número inteiro (ex.: 2)' })}
              aria-label={rotulo}
            />
          </label>
        ))}
      </div>
      {proposta.dias_previstos === null && proposta.dias_sugeridos ? (
        <p className="text-xs text-muted-foreground">
          Sugestão pelas horas dos passos das instruções, em jornadas de 8 h: {proposta.dias_sugeridos}{' '}
          {proposta.dias_sugeridos === 1 ? 'dia' : 'dias'}.
          {editavel && (
            <button type="button" className="ml-1 underline underline-offset-2 hover:text-foreground" onClick={() => onChange({ dias_previstos: proposta.dias_sugeridos ?? null })}>
              Usar
            </button>
          )}
        </p>
      ) : null}
    </div>
  );
}
