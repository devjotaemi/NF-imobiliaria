import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

import { sessionSecret } from "@/lib/config";

const scrypt = promisify(scryptCallback) as (
  senha: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

export const COOKIE_SESSAO = "nf_sessao";
export const SESSAO_MAX_AGE_SEGUNDOS = 60 * 60 * 8; // 8h — um turno de trabalho

// ---------------------------------------------------------------------------
// Senha
// ---------------------------------------------------------------------------

const SCRYPT_KEYLEN = 64;

/** Gera o hash pra guardar no banco. Formato: scrypt$<salt hex>$<hash hex> */
export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const derivada = await scrypt(senha, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${derivada.toString("hex")}`;
}

/** Compara em tempo constante — não vaza informação pelo tempo de resposta. */
export async function conferirSenha(
  senha: string,
  hashGuardado: string,
): Promise<boolean> {
  const partes = hashGuardado.split("$");
  if (partes.length !== 3 || partes[0] !== "scrypt") return false;
  if (!/^[a-f\d]{32}$/i.test(partes[1]) || !/^[a-f\d]{128}$/i.test(partes[2])) {
    return false;
  }

  const salt = Buffer.from(partes[1], "hex");
  const esperado = Buffer.from(partes[2], "hex");
  if (esperado.length !== SCRYPT_KEYLEN) return false;

  const derivada = await scrypt(senha, salt, SCRYPT_KEYLEN);
  return timingSafeEqual(derivada, esperado);
}

// ---------------------------------------------------------------------------
// Token de sessão (cookie assinado)
// ---------------------------------------------------------------------------

type PayloadSessao = {
  /** id do AdminUser */
  sub: string;
  /** expiração, em segundos desde a epoch */
  exp: number;
};

function assinar(dados: string): string {
  return createHmac("sha256", sessionSecret()).update(dados).digest("base64url");
}

export function criarTokenSessao(userId: string): string {
  const payload: PayloadSessao = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + SESSAO_MAX_AGE_SEGUNDOS,
  };
  const corpo = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${corpo}.${assinar(corpo)}`;
}

/**
 * Valida assinatura e expiração. Devolve o id do usuário, ou null.
 * Não toca no banco: serve tanto pro proxy quanto pro servidor.
 */
export function lerTokenSessao(token: string | undefined): string | null {
  if (!token) return null;

  const separador = token.lastIndexOf(".");
  if (separador <= 0) return null;

  const corpo = token.slice(0, separador);
  const assinaturaRecebida = token.slice(separador + 1);
  const assinaturaEsperada = assinar(corpo);

  const a = Buffer.from(assinaturaRecebida);
  const b = Buffer.from(assinaturaEsperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(corpo, "base64url").toString("utf8"),
    ) as Partial<PayloadSessao>;

    if (
      typeof payload.sub !== "string" ||
      payload.sub.length === 0 ||
      typeof payload.exp !== "number" ||
      !Number.isSafeInteger(payload.exp)
    ) {
      return null;
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

    return payload.sub;
  } catch {
    return null;
  }
}
