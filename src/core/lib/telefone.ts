/**
 * Telefone guardado em E.164 (`+5562999998888`) e mostrado com máscara
 * (SN-46). `telefoneE164` é a mesma regra da API
 * (aupus-service-api/src/common/helpers/contato.ts): mudou lá, muda aqui.
 *
 * Brasil (padrão, sem código do país): DDD + fixo de 8 dígitos ou celular de 9
 * começando em 9; aceita máscara, +55 e o 0 da operadora. Outro país: `+` (ou
 * `00`) e de 8 a 15 dígitos.
 */
export function telefoneE164(texto: string): string | null {
  const limpo = texto.trim();
  const digitos = limpo.replace(/\D/g, '');
  if (!digitos) return null;

  if (limpo.startsWith('+')) return internacional(digitos);
  if (digitos.startsWith('00')) return internacional(digitos.slice(2));
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) return brasileiro(digitos.slice(2));
  if ((digitos.length === 11 || digitos.length === 12) && digitos.startsWith('0')) return brasileiro(digitos.slice(1));
  return brasileiro(digitos);
}

function internacional(digitos: string): string | null {
  if (digitos.startsWith('55')) return brasileiro(digitos.slice(2));
  return /^[1-9]\d{7,14}$/.test(digitos) ? `+${digitos}` : null;
}

function brasileiro(nacional: string): string | null {
  // Fixo começa de 2 a 5; começando em 9 é celular com um dígito a menos
  return /^[1-9][1-9](?:[2-5]\d{7}|9\d{8})$/.test(nacional) ? `+55${nacional}` : null;
}

/** Máscara brasileira de até 11 dígitos: `(62) 99999-8888` ou `(62) 3333-4444`. */
function mascaraNacional(digitos: string): string {
  const d = digitos.slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  // 9 dígitos depois do DDD: celular (5 + 4); até 8: fixo (4 + 4)
  const corte = resto.length > 8 ? 5 : 4;
  return resto.length > corte ? `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}` : `(${ddd}) ${resto}`;
}

/** Como o número gravado aparece na tela. O que não está em E.164 (dado antigo) aparece como está. */
export function formatarTelefone(valor: string | null | undefined): string {
  if (!valor) return '';
  const nacional = valor.match(/^\+55(\d{10,11})$/)?.[1];
  return nacional ? mascaraNacional(nacional) : valor;
}

/** A máscara enquanto a pessoa digita. Começou com `+`: número de outro país, sem máscara. */
export function mascararTelefone(digitado: string): string {
  if (digitado.trim().startsWith('+')) return `+${digitado.replace(/\D/g, '').slice(0, 15)}`;
  const digitos = digitado.replace(/\D/g, '');
  // Mais de 11 dígitos é número com prefixo (0, 55, 00) ainda incompleto: sem
  // máscara, para não cortar o que falta digitar
  if (digitos.length > 11) return digitos.slice(0, 15);
  return digitos ? mascaraNacional(digitos) : '';
}
