export function mesParaData(mes: string): Date | null {
  const partes = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(mes);
  if (!partes) return null;

  const ano = Number(partes[1]);
  if (ano < 100) return null;

  return new Date(Date.UTC(ano, Number(partes[2]) - 1, 1));
}
