import Image from "next/image";

import { PhotoUploader } from "@/components/admin/photo-uploader";
import { adicionarFotos, definirCapa, removerFoto } from "../actions";

type Foto = {
  id: string;
  url: string;
  altText: string | null;
  ordem: number;
};

/**
 * Fotos do imóvel já cadastrado.
 *
 * Cada ação (subir, remover, definir capa) grava na hora, sem depender de
 * salvar o formulário principal — é assim que o corretor espera que funcione.
 */
export function GerenciadorFotos({
  imovelId,
  fotos,
}: {
  imovelId: string;
  fotos: Foto[];
}) {
  return (
    <div className="flex flex-col gap-5">
      {fotos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {fotos.map((foto, indice) => (
            <li
              key={foto.id}
              className="overflow-hidden rounded-lg border border-slate-200"
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image
                  src={foto.url}
                  alt={foto.altText ?? ""}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                {indice === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                    capa
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-1 p-2">
                {indice === 0 ? (
                  <span className="text-xs text-slate-400">principal</span>
                ) : (
                  <form action={definirCapa.bind(null, foto.id)}>
                    <button
                      type="submit"
                      className="text-xs text-slate-600 underline-offset-2 hover:underline"
                    >
                      tornar capa
                    </button>
                  </form>
                )}

                <form action={removerFoto.bind(null, foto.id)}>
                  <button
                    type="submit"
                    className="text-xs text-red-600 underline-offset-2 hover:underline"
                  >
                    remover
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Nenhuma foto ainda.</p>
      )}

      <form action={adicionarFotos.bind(null, imovelId)} className="flex flex-col gap-3">
        <PhotoUploader />
        <button
          type="submit"
          className="w-fit rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Salvar fotos enviadas
        </button>
      </form>
    </div>
  );
}
