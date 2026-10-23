/**
 * "O equipamento parou?" como a OS registra (SN-60). A resposta é gravada desde
 * que quando parou e quando voltou ficaram opcionais (19/out/2026): deduzida das
 * datas, um "sim" sem horário ficaria igual a um "não". Sem resposta gravada
 * (o conteúdo de uma OS finalizada antes), a parada informada é "sim".
 */
interface ParadaDaOS {
  equipamento_parou?: boolean | null;
  parada_inicio?: string | null;
}

export function equipamentoParou(os: ParadaDaOS): boolean | null {
  if (typeof os.equipamento_parou === 'boolean') return os.equipamento_parou;
  return os.parada_inicio ? true : null;
}

/** Para a leitura e o PDF: o "sim" sem horário diz que a duração não foi informada */
export function rotuloDoParou(os: ParadaDaOS): string | null {
  const parou = equipamentoParou(os);
  if (parou === null) return null;
  if (!parou) return 'Não';
  return os.parada_inicio ? 'Sim' : 'Sim, sem o horário da parada';
}
