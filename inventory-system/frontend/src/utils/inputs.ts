// Quantidade: aceita somente digitos.
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

// Dinheiro: aceita somente digitos e UM separador decimal (virgula ou ponto),
// com no maximo 2 casas. Sempre devolve com virgula (padrao brasileiro).
export function sanitizeMoney(value: string): string {
  const cleaned = value.replace(/[^\d.,]/g, "");
  const separatorIndex = cleaned.search(/[.,]/);
  if (separatorIndex === -1) return cleaned;
  const integerPart = cleaned.slice(0, separatorIndex);
  const decimalPart = cleaned
    .slice(separatorIndex + 1)
    .replace(/[.,]/g, "")
    .slice(0, 2);
  return `${integerPart},${decimalPart}`;
}
