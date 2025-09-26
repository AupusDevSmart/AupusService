// src/utils/address.utils.ts
export interface AddressData {
  endereco?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

/**
 * Concatena os campos de endereço em uma string limpa e legível
 * @param addressData - Dados do endereço
 * @returns String concatenada do endereço completo
 */
export function concatenateAddress(addressData: AddressData): string {
  const parts: string[] = [];

  // Adicionar endereço principal
  if (addressData.endereco?.trim()) {
    parts.push(addressData.endereco.trim());
  }

  // Adicionar complemento se existir
  if (addressData.complemento?.trim()) {
    parts.push(addressData.complemento.trim());
  }

  // Adicionar bairro se existir
  if (addressData.bairro?.trim()) {
    parts.push(addressData.bairro.trim());
  }

  // Adicionar cidade e estado se existirem
  const cityState: string[] = [];
  if (addressData.cidade?.trim()) {
    cityState.push(addressData.cidade.trim());
  }
  if (addressData.estado?.trim()) {
    cityState.push(addressData.estado.trim());
  }
  if (cityState.length > 0) {
    parts.push(cityState.join(' - '));
  }

  // Adicionar CEP se existir
  if (addressData.cep?.trim()) {
    parts.push(`CEP: ${addressData.cep.trim()}`);
  }

  return parts.join(', ');
}

/**
 * Valida se os dados de endereço estão completos
 * @param addressData - Dados do endereço
 * @returns true se o endereço tem informações mínimas
 */
export function isAddressValid(addressData: AddressData): boolean {
  return !!(addressData.endereco?.trim() && addressData.bairro?.trim());
}