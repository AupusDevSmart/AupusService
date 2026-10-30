// src/features/solicitacoes-servico/components/FechamentoDaProposta.tsx
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { DicaDaConta, type Explicacao } from '@/components/common/ComoSeCalcula';
import { AVISO_DE_DINHEIRO, dinheiroNoCampo, lerDinheiroDigitado, numeroNoCampo } from '@/utils/leitura';
import { moeda, percentualNaTela, type CondicoesDaProposta, type Proposta, type TipoDeDesconto } from '@/services/proposta.services';
import { TituloDaSecao } from './TituloDaSecao';

interface FechamentoDaPropostaProps {
  proposta: Proposta;
  /** Quem monta proposta ajusta os percentuais, o desconto e as condições */
  ajusta: boolean;
  onChange: (dados: CondicoesDaProposta, oQue: string) => void;
  /** As contas do fechamento, uma por número (os ícones discretos) */
  explicacoes?: Explicacao[];
}

/**
 * O fechamento (29/out/2026): o custo dos serviços, o imposto e a margem que dão
 * o preço, a administração (com o imposto dela), o desconto sobre o total
 * inteiro, e os três totais da spec: o faturado pela Aupus, o direto e o
 * investimento global. Quem não monta proposta (o cliente) vê só os preços.
 * É a parte de destaque da proposta (30/out/2026): um painel de fundo neutro, a
 * conta em cima e os totais embaixo, o investimento global maior.
 */
export function FechamentoDaProposta({ proposta, ajusta, onChange, explicacoes = [] }: FechamentoDaPropostaProps) {
  const dica = (rotulo: string) => {
    const explicacao = explicacoes.find((e) => e.rotulo === rotulo);
    return explicacao ? <DicaDaConta {...explicacao} /> : null;
  };
  const f = proposta.fechamento;

  // O tipo escolhido antes de digitar o valor: sem valor, não há o que gravar
  const [tipoNovo, setTipoNovo] = useState<TipoDeDesconto | null>(null);
  const tipoDoDesconto = proposta.desconto_tipo ?? tipoNovo;
  // Remonta o campo recusado: senão ele seguia mostrando o número que não valeu
  const [versao, setVersao] = useState(0);
  const recusar = (titulo: string, descricao?: string) => {
    toast.error(titulo, descricao ? { description: descricao } : undefined);
    setVersao((v) => v + 1);
  };

  const trocarPercentual = (campo: 'imposto_percentual' | 'margem_percentual' | 'adm_servicos_percentual' | 'adm_fd_percentual', valor: number | null) => {
    if (valor === null) return setVersao((v) => v + 1);
    if (valor > 100) return recusar('O percentual vai até 100%');
    const imposto = campo === 'imposto_percentual' ? valor : (proposta.imposto_percentual ?? 0);
    const margem = campo === 'margem_percentual' ? valor : (proposta.margem_percentual ?? 0);
    if (imposto + margem >= 100) return recusar('O imposto e a margem somam 100% ou mais', 'O preço não fecha: a conta divide por (1 − imposto − margem).');
    onChange({ [campo]: valor }, 'o percentual');
  };

  const tirarDesconto = () => {
    setTipoNovo(null);
    if (proposta.desconto_tipo) onChange({ desconto_tipo: null }, 'o desconto');
  };

  const gravarDesconto = (tipo: TipoDeDesconto, valor: number | null) => {
    if (valor === null || valor === 0) return tirarDesconto();
    if (tipo === 'PERCENTUAL' && valor > 100) return recusar('O desconto em percentual vai até 100%');
    // O desconto sai do faturamento da Aupus: o faturamento direto é nota do fornecedor
    const aupus = f?.total_aupus_sem_desconto ?? 0;
    const pedido = tipo === 'PERCENTUAL' ? ((f?.total_geral_sem_desconto ?? 0) * valor) / 100 : valor;
    if (f && Math.round(pedido * 100) > Math.round(aupus * 100)) {
      return recusar('O desconto passa do faturamento da Aupus', `O faturamento da Aupus é ${moeda(aupus)}; o faturamento direto é pago ao fornecedor.`);
    }
    setTipoNovo(null);
    onChange({ desconto_tipo: tipo, desconto_valor: valor }, 'o desconto');
  };

  /** Trocar % por R$ (ou o contrário) com desconto gravado mantém os reais descontados */
  const trocarTipoDeDesconto = (escolha: string) => {
    if (escolha === 'NENHUM') return tirarDesconto();
    const tipo = escolha as TipoDeDesconto;
    if (!proposta.desconto_tipo) return setTipoNovo(tipo);
    if (tipo === proposta.desconto_tipo) return;
    const base = f?.total_geral_sem_desconto ?? 0;
    const valor = tipo === 'VALOR' ? proposta.total_desconto : base > 0 ? Math.round((proposta.total_desconto / base) * 100 * 100) / 100 : 0;
    gravarDesconto(tipo, valor);
  };

  const descontoLimitado = f !== null && f.desconto_pedido > proposta.total_desconto + 0.005;
  const margemAbaixo = proposta.margem_efetiva !== null && proposta.margem_percentual !== null && proposta.margem_efetiva < proposta.margem_percentual - 0.0005;

  const percentual = (campo: 'imposto_percentual' | 'margem_percentual' | 'adm_servicos_percentual' | 'adm_fd_percentual', rotulo: string) =>
    ajusta ? (
      <CampoDeNumero
        key={`${campo}-${versao}`}
        className="h-7 w-16 text-right"
        value={proposta[campo]}
        onChange={(valor) => trocarPercentual(campo, valor)}
        avisoCurto
        aviso="Percentual com vírgula (ex.: 12,5)"
        aria-label={rotulo}
      />
    ) : (
      <span>{percentualNaTela(proposta[campo] ?? 0)}</span>
    );

  return (
    // O contorno só no claro: lá o cinza do painel é quase o do sheet; no escuro, o fundo basta
    <div className="space-y-2 rounded-lg border border-border bg-muted p-4 dark:border-transparent">
      <TituloDaSecao titulo="Fechamento" />
      <dl className="space-y-1.5">
        {f && (
          <>
            <Linha rotulo="Instruções" valor={f.custo_instrucoes} />
            <Linha rotulo="Frete, deslocamento e diárias" valor={f.custo_logistica} />
            <Linha rotulo="Custos adicionais" valor={f.custo_adicionais} />
            <Linha rotulo="Custo dos serviços" valor={f.custo_servicos} forte dica={dica('Custo dos serviços')} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                Imposto {percentual('imposto_percentual', 'Imposto em percentual')}% e margem {percentual('margem_percentual', 'Margem em percentual')}%
                {dica('Preço dos serviços')}
              </dt>
              <dd className="text-sm tabular-nums">{moeda(f.preco_servicos)}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                Administração {percentual('adm_servicos_percentual', 'Administração sobre os serviços')}% dos serviços e{' '}
                {percentual('adm_fd_percentual', 'Administração sobre o faturamento direto')}% do direto
                {dica('Administração')}
              </dt>
              <dd className="text-sm tabular-nums">{moeda(f.preco_administracao)}</dd>
            </div>
          </>
        )}
        {!f && proposta.venda && (
          // O cliente: a venda, sem o custo nem os percentuais
          <>
            <Linha rotulo="Serviços" valor={Math.round(proposta.itens.reduce((s, i) => s + (i.valor_venda ?? 0), 0) * 100) / 100} />
            {proposta.venda.logistica > 0 && <Linha rotulo="Logística e mobilização" valor={proposta.venda.logistica} />}
            {proposta.venda.adicionais > 0 && <Linha rotulo="Custos adicionais" valor={proposta.venda.adicionais} />}
            {(proposta.total_administracao ?? 0) > 0 && <Linha rotulo="Administração" valor={proposta.total_administracao ?? 0} />}
          </>
        )}

        {(ajusta || proposta.desconto_tipo) && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              Desconto
              {dica('Desconto')}
              {ajusta ? (
                <>
                  <Select value={tipoDoDesconto ?? 'NENHUM'} onValueChange={trocarTipoDeDesconto}>
                    <SelectTrigger className="h-8 w-[108px]" aria-label="Como é o desconto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NENHUM">Nenhum</SelectItem>
                      <SelectItem value="PERCENTUAL">%</SelectItem>
                      <SelectItem value="VALOR">R$</SelectItem>
                    </SelectContent>
                  </Select>
                  {tipoDoDesconto && (
                    <CampoDeNumero
                      key={`desconto-${versao}`}
                      className="h-8 w-24 text-right"
                      value={proposta.desconto_tipo ? proposta.desconto_valor : null}
                      onChange={(valor) => gravarDesconto(tipoDoDesconto, valor)}
                      ler={lerDinheiroDigitado}
                      mostrar={tipoDoDesconto === 'VALOR' ? dinheiroNoCampo : numeroNoCampo}
                      aviso={tipoDoDesconto === 'VALOR' ? AVISO_DE_DINHEIRO : 'Percentual com vírgula e até 2 casas (ex.: 12,5)'}
                      avisoCurto
                      placeholder={tipoDoDesconto === 'VALOR' ? '0,00' : '0'}
                      aria-label={tipoDoDesconto === 'VALOR' ? 'Desconto em reais' : 'Desconto em percentual'}
                    />
                  )}
                </>
              ) : (
                proposta.desconto_tipo === 'PERCENTUAL' && <span>({percentualNaTela(proposta.desconto_valor ?? 0)}%)</span>
              )}
            </dt>
            <dd className="text-sm tabular-nums">{proposta.total_desconto > 0 ? `− ${moeda(proposta.total_desconto)}` : moeda(0)}</dd>
          </div>
        )}
        {descontoLimitado && f && (
          <p className="text-xs text-muted-foreground">
            O desconto pedido ({moeda(f.desconto_pedido)}) passa do faturamento da Aupus de agora: vale até ele.
          </p>
        )}

        <div className="space-y-1.5 border-t border-border pt-2.5">
          <Linha rotulo="Total faturado pela Aupus" valor={proposta.total_aupus ?? 0} forte dica={dica('Total faturado pela Aupus')} />
          {(proposta.total_fd ?? 0) > 0 && <Linha rotulo="Faturamento direto (fornecedores)" valor={proposta.total_fd ?? 0} dica={dica('Faturamento direto')} />}
          <Linha rotulo="Investimento global" valor={proposta.total_geral ?? 0} destaque dica={dica('Investimento global')} />
        </div>
      </dl>

      {f && (
        <p className={`flex flex-wrap items-center gap-1 text-xs ${margemAbaixo ? 'text-destructive' : 'text-muted-foreground'}`}>
          Imposto {moeda(proposta.valor_imposto ?? 0)}. {dica('Imposto')} Margem efetiva{' '}
          {proposta.margem_efetiva === null ? '—' : `${percentualNaTela(proposta.margem_efetiva)}%`}
          {margemAbaixo && ` — abaixo dos ${percentualNaTela(proposta.margem_percentual ?? 0)}% definidos (o desconto come a margem)`}.
          {dica('Margem efetiva')}
        </p>
      )}
    </div>
  );
}

function Linha({ rotulo, valor, forte, destaque, dica }: { rotulo: string; valor: number; forte?: boolean; destaque?: boolean; dica?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={`flex items-center gap-1.5 ${destaque ? 'text-sm font-semibold' : forte ? 'text-sm font-medium' : 'text-sm text-muted-foreground'}`}>
        {rotulo}
        {dica}
      </dt>
      <dd className={`tabular-nums ${destaque ? 'text-lg font-semibold' : forte ? 'text-sm font-medium' : 'text-sm'}`}>{moeda(valor)}</dd>
    </div>
  );
}
