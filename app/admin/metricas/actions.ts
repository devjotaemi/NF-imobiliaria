"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { exigirUsuario } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { brlParaCentavos } from "@/lib/format";
import { mesParaData } from "@/lib/metrics-month";

const EsquemaGasto = z.object({
  campanha: z.string().trim().min(1, "Informe a campanha"),
  valor: z.string().trim().min(1, "Informe o valor"),
  mes: z.string().refine((valor) => mesParaData(valor) !== null, "Mês inválido"),
});

export type EstadoGasto = { erro?: string; ok?: boolean };

export async function salvarGasto(
  _estadoAnterior: EstadoGasto,
  formData: FormData,
): Promise<EstadoGasto> {
  await exigirUsuario();

  const analise = EsquemaGasto.safeParse({
    campanha: formData.get("campanha"),
    valor: formData.get("valor"),
    mes: formData.get("mes"),
  });

  if (!analise.success) {
    return { erro: analise.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { campanha, valor, mes } = analise.data;

  const valorCentavos = brlParaCentavos(valor);
  if (valorCentavos === null) return { erro: "Valor inválido" };

  const mesReferencia = mesParaData(mes);
  if (!mesReferencia) return { erro: "Mês inválido" };

  await db.campaignSpend.upsert({
    where: { campanha_mesReferencia: { campanha, mesReferencia } },
    create: { campanha, mesReferencia, valorCentavos },
    update: { valorCentavos },
  });

  revalidatePath("/admin/metricas");
  return { ok: true };
}
