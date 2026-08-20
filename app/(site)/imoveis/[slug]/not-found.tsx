import Link from "next/link";

export default function ImovelNaoEncontrado() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-slate-900">
        Imóvel não disponível
      </h1>
      <p className="mt-3 text-slate-600">
        Este imóvel saiu do ar ou o endereço está incorreto. Veja os imóveis
        disponíveis agora.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
      >
        Ver imóveis
      </Link>
    </div>
  );
}
