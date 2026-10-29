"use client";

import toast from "react-hot-toast";

// Il link d'accesso da mandare al trainer quando l'email non parte da sola.
export default function LinkDaCopiare({ link }: { link: string }) {
  const copia = async () => {
    await navigator.clipboard.writeText(link);
    toast.success("Link copiato");
  };
  return (
    <div className="mt-3 flex items-center gap-2 rounded-2xl bg-soft p-2">
      <input readOnly value={link} className="min-w-0 flex-1 bg-transparent px-2 text-xs text-muted outline-none" onFocus={(e) => e.target.select()} />
      <button type="button" onClick={copia} className="btn btn-trainer btn-sm rounded-xl border-0">
        Copia
      </button>
    </div>
  );
}
