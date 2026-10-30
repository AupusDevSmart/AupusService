// src/features/solicitacoes-servico/components/PlanejamentoDaProposta.tsx
import { Clock, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { DicaDaConta, type Explicacao } from '@/components/common/ComoSeCalcula';
import { lerDinheiroDigitado, lerNumeroDigitado } from '@/utils/leitura';
import type { CondicoesDaProposta, Proposta } from '@/services/proposta.services';
import { TituloDaSecao } from './TituloDaSecao';
import { contaDosDias, horasNaTela, numeroNaTela } from '@/features/solicitacoes-servico/utils/duracao-da-proposta';

/** Pessoas e noites são inteiros: "2,5 pessoas" vira 3 (o servidor recusaria) */
const lerInteiro = (texto: string) => {
  const valor = lerNumeroDigitado(texto);
  return valor === null || valor === undefined ? valor : Math.round(valor);
};

/** Km e dias: até 2 casas e sem negativo, como a API (com 4 casas, o salvar inteiro do rascunho era recusado) */
const lerDuasCasas = (texto: string) => {
  const valor = lerDinheiroDigitado(texto);
  return typeof valor === 'number' && valor < 0 ? undefined : valor;
};

interface PlanejamentoDaPropostaProps {
  proposta: Proposta;
  editavel: boolean;
  onChange: (dados: CondicoesDaProposta) => void;
  explicacao?: Explicacao;
}

/**
 * O planejamento da proposta: o km de ida basta (30/out/2026). A ida e volta é o
 * dobro da ida; o interno, os dias, as pessoas e as noites vazios valem o
 * calculado (em cinza no campo), e as linhas de km e de refeições das tabelas
 * acompanham daqui. A proposta de antes, com a logística digitada, oferece ligar.
 */
export function PlanejamentoDaProposta({ proposta, editavel, onChange, explicacao }: PlanejamentoDaPropostaProps) {
  const c = proposta.planejamento_calculado;
  const sugestao = (valor: number | null | undefined) => (valor === null || valor === undefined ? undefined : numeroNaTela(valor));

  const campos: { rotulo: string; valor: number | null; onChange: (v: number | null) => void; inteiro?: boolean; placeholder?: string }[] = [
    { rotulo: 'Distância (km, ida)', valor: proposta.distancia_km, onChange: (v) => onChange({ distancia_km: v }) },
    {
      rotulo: 'Interno na obra (km)',
      valor: proposta.deslocamento_interno_km,
      onChange: (v) => onChange({ deslocamento_interno_km: v }),
      placeholder: sugestao(c?.interno_sugerido_km),
    },
    { rotulo: 'Dias', valor: proposta.dias_previstos, onChange: (v) => onChange({ dias_previstos: v }), placeholder: sugestao(c?.dias_sugeridos) },
    { rotulo: 'Pessoas', valor: proposta.pessoas_previstas, onChange: (v) => onChange({ pessoas_previstas: v }), inteiro: true, placeholder: sugestao(c?.pessoas) },
    { rotulo: 'Noites fora', valor: proposta.noites_fora, onChange: (v) => onChange({ noites_fora: v }), inteiro: true, placeholder: sugestao(c?.noites_sugeridas) },
  ];

  const resumo = [
    c?.ida_e_volta_km ? `ida e volta ${numeroNaTela(c.ida_e_volta_km)} km` : null,
    c?.horas_por_trecho ? `${horasNaTela(c.horas_por_trecho)} de estrada por trecho` : null,
    c?.bate_volta === true ? 'volta no mesmo dia' : c?.bate_volta === false ? 'dorme no local' : null,
    c?.veiculos ? `${c.veiculos} ${c.veiculos === 1 ? 'veículo' : 'veículos'}` : null,
    c?.km_por_veiculo ? `${numeroNaTela(c.km_por_veiculo)} km por veículo` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-2">
      <TituloDaSecao titulo="Planejamento" explicacao={explicacao} />
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-5">
        {campos.map(({ rotulo, valor, onChange: trocar, inteiro, placeholder }) => (
          <label key={rotulo} className="flex flex-col gap-1 text-xs text-muted-foreground">
            {rotulo}
            <CampoDeNumero
              className="h-8 text-right"
              value={valor}
              disabled={!editavel}
              onChange={trocar}
              placeholder={placeholder}
              avisoCurto
              {...(inteiro ? { ler: lerInteiro, aviso: 'Número inteiro (ex.: 2)' } : { ler: lerDuasCasas, aviso: 'Número com vírgula e até 2 casas (ex.: 12,5)' })}
              aria-label={rotulo}
            />
          </label>
        ))}
      </div>
      {contaDosDias(proposta) && (
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="font-medium text-foreground">Duração</span>
          <span>{contaDosDias(proposta)}</span>
          {(c?.horas_por_instrucao?.length ?? 0) > 0 && (
            <DicaDaConta
              rotulo="as horas de cada instrução"
              linhas={[
                ...(c?.horas_por_instrucao ?? []).map((i) => `${i.descricao}: ${horasNaTela(i.horas)}`),
                'As horas são as dos passos de cada instrução, uma depois da outra (sem supor equipe em paralelo).',
              ]}
            />
          )}
        </p>
      )}
      {resumo.length > 0 && <p className="text-xs text-muted-foreground">{resumo.join(' · ')}. Campo vazio usa o calculado, em cinza.</p>}
      {proposta.logistica_automatica === false && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Esta proposta é de antes da logística automática: o deslocamento e as diárias foram digitados.</span>
          {editavel && (
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onChange({ logistica_automatica: true })}>
              <Wand2 className="mr-1 h-3.5 w-3.5" />
              Calcular automaticamente
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
