export type OpcoesImportacao = {
  dryRun: boolean;
  rascunho: boolean;
  somenteNovos: boolean;
  limparTelefone: boolean;
  modoFotos: "link" | "blob";
  destaques: number;
  slug: string;
};

export function lerOpcoesImportacao(
  argumentos: string[],
  slugPadrao: string,
  slugAmbiente?: string,
): OpcoesImportacao {
  const opcoes: OpcoesImportacao = {
    dryRun: false,
    rascunho: false,
    somenteNovos: false,
    limparTelefone: false,
    modoFotos: "link",
    destaques: 0,
    slug: slugAmbiente || slugPadrao,
  };

  for (const argumento of argumentos) {
    if (argumento === "--dry-run") opcoes.dryRun = true;
    else if (argumento === "--rascunho") opcoes.rascunho = true;
    else if (argumento === "--somente-novos") opcoes.somenteNovos = true;
    else if (argumento === "--limpar-telefone") opcoes.limparTelefone = true;
    else if (argumento === "--fotos=link") opcoes.modoFotos = "link";
    else if (argumento === "--fotos=blob") opcoes.modoFotos = "blob";
    else if (argumento.startsWith("--destaques=")) {
      const valor = argumento.slice("--destaques=".length);
      if (!/^\d+$/.test(valor) || !Number.isSafeInteger(Number(valor))) {
        throw new Error("--destaques precisa ser um número inteiro não negativo.");
      }
      opcoes.destaques = Number(valor);
    } else if (argumento.startsWith("--slug=")) {
      opcoes.slug = argumento.slice("--slug=".length);
    } else {
      throw new Error(`Opção desconhecida: ${argumento}`);
    }
  }

  if (!/^[a-z0-9-]+$/i.test(opcoes.slug)) {
    throw new Error("O slug do perfil precisa conter só letras, números e hífens.");
  }

  return opcoes;
}
