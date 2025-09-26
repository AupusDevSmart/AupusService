// src/utils/recursos.utils.ts
// Utilitários para cálculos de recursos (materiais, ferramentas, técnicos)

/**
 * Calcula o custo total de um material baseado na quantidade e custo unitário
 */
export const calcularCustoTotalMaterial = (material: {
  quantidade_planejada?: number;
  custo_unitario?: number;
}): number => {
  const quantidade = material.quantidade_planejada || 0;
  const custoUnitario = material.custo_unitario || 0;
  return quantidade * custoUnitario;
};

/**
 * Calcula o custo total de um técnico baseado nas horas e custo por hora
 */
export const calcularCustoTotalTecnico = (tecnico: {
  horas_estimadas?: number;
  horas_trabalhadas?: number;
  custo_hora?: number;
}, mode: 'planejamento' | 'execucao' = 'planejamento'): number => {
  const custo_hora = tecnico.custo_hora || 0;

  if (mode === 'execucao' && tecnico.horas_trabalhadas !== undefined) {
    return tecnico.horas_trabalhadas * custo_hora;
  }

  const horas_estimadas = tecnico.horas_estimadas || 0;
  return horas_estimadas * custo_hora;
};

/**
 * Processa lista de materiais adicionando custo_total calculado
 */
export const processarMateriaisComCustos = (materiais: any[]): any[] => {
  return materiais.map(material => ({
    ...material,
    custo_total: calcularCustoTotalMaterial(material),
    custoTotal: calcularCustoTotalMaterial(material) // Alias para compatibilidade
  }));
};

/**
 * Processa lista de técnicos adicionando custo_total calculado
 */
export const processarTecnicosComCustos = (tecnicos: any[], mode: 'planejamento' | 'execucao' = 'planejamento'): any[] => {
  return tecnicos.map(tecnico => ({
    ...tecnico,
    custo_total: calcularCustoTotalTecnico(tecnico, mode),
    custoTotal: calcularCustoTotalTecnico(tecnico, mode) // Alias para compatibilidade
  }));
};

/**
 * Calcula o custo total de uma lista de materiais
 */
export const calcularCustoTotalMateriais = (materiais: any[]): number => {
  return materiais.reduce((total, material) => {
    return total + calcularCustoTotalMaterial(material);
  }, 0);
};

/**
 * Calcula o custo total de uma lista de técnicos
 */
export const calcularCustoTotalTecnicos = (tecnicos: any[], mode: 'planejamento' | 'execucao' = 'planejamento'): number => {
  return tecnicos.reduce((total, tecnico) => {
    return total + calcularCustoTotalTecnico(tecnico, mode);
  }, 0);
};