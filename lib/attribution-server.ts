import "server-only";

import { cookies } from "next/headers";

import {
  COOKIE_ATRIBUICAO,
  desserializarAtribuicao,
  type Atribuicao,
} from "@/lib/attribution";

/** Lê a atribuição gravada pelo proxy. Só server-side. */
export async function lerAtribuicao(): Promise<Atribuicao> {
  const cookieStore = await cookies();
  return desserializarAtribuicao(cookieStore.get(COOKIE_ATRIBUICAO)?.value);
}

/**
 * A visita veio de campanha paga?
 *
 * Usado pra esconder o link da OLX no rodapé. Foi exatamente esse o erro que o
 * conselho pegou no projeto anterior: tráfego pago sendo entregue de graça pra
 * plataforma concorrente.
 */
export async function ehTrafegoPago(): Promise<boolean> {
  return (await lerAtribuicao()).pago;
}
