"use client";

/**
 * `<form method="get">` que não escreve parâmetro vazio na URL.
 *
 * Um formulário nativo serializa TODO campo com `name`, então buscar sem
 * preencher nada geraria `?precoMin=&precoMax=&areaMin=…`. Funciona, porque o
 * parser trata string vazia como ausente, mas o link que o visitante manda no
 * WhatsApp fica ilegível.
 *
 * A limpeza é melhoria progressiva: desabilitar campo vazio no envio tira ele
 * da querystring. Sem JavaScript o formulário continua enviando e filtrando
 * igual — só com a URL mais feia.
 */
export function FormGet({
  action,
  className,
  children,
}: {
  action: string;
  className?: string;
  children: React.ReactNode;
}) {
  function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    const formulario = evento.currentTarget;
    const desabilitados: (HTMLInputElement | HTMLSelectElement)[] = [];

    for (const campo of Array.from(formulario.elements)) {
      const ehCampo =
        campo instanceof HTMLInputElement || campo instanceof HTMLSelectElement;
      if (!ehCampo || !campo.name || campo.disabled) continue;
      // Radio/checkbox desmarcado já não é enviado — mexer neles quebraria
      // o campo marcado que compartilha o mesmo `name`.
      if (campo instanceof HTMLInputElement && campo.type !== "text" && campo.type !== "search" && campo.type !== "number") {
        continue;
      }
      if (campo.value === "") {
        campo.disabled = true;
        desabilitados.push(campo);
      }
    }

    // Devolve o estado: se a página voltar do bfcache, os campos precisam
    // estar utilizáveis de novo.
    setTimeout(() => {
      for (const campo of desabilitados) campo.disabled = false;
    }, 0);
  }

  return (
    <form method="get" action={action} onSubmit={aoEnviar} className={className}>
      {children}
    </form>
  );
}
