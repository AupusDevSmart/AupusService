import type { CampoApagavelDoVeiculo } from '@/services/veiculos.services';

const APAGAVEIS: CampoApagavelDoVeiculo[] = ['cor', 'proximaRevisao', 'responsavel', 'observacoes', 'chassi', 'renavam', 'seguradora', 'vencimentoSeguro'];

/**
 * Os opcionais do veículo para o editar: o texto aparado, ou null quando a
 * pessoa apagou (SN-78). O editar só mandava o campo com valor, então apagar a
 * próxima revisão, o seguro, a cor ou as observações não apagava nada — e a
 * planilha, que manda null, apagava: os dois caminhos davam resultados
 * diferentes para o mesmo gesto. Vazio vai null, não "": a API recusa "" pelo
 * tamanho mínimo.
 */
export function opcionaisApagaveis(dados: Partial<Record<CampoApagavelDoVeiculo, string | null | undefined>>): Record<CampoApagavelDoVeiculo, string | null> {
  return Object.fromEntries(APAGAVEIS.map((campo) => [campo, dados[campo]?.trim() || null])) as Record<CampoApagavelDoVeiculo, string | null>;
}
