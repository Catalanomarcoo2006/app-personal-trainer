// Documenti del cliente (Profilo): la dieta del nutrizionista, le analisi, quello che carica lui. Controllo dei file
// prima di salvarli e foto rimpicciolite nel browser (lato lungo 1600 px, JPEG), così pesano poco.

export type Documento = {
  id: string;
  nome: string;
  tipo: "pdf" | "foto";
  da: "nutrizionista" | "trainer" | "cliente";
  data: string; // "AAAA-MM-GG"
  file: Blob | string; // un file caricato (Blob, passa tra le finestre) o un indirizzo dei PDF della demo
};

export const MAX_MB = 10;

export function controllaFile(f: { name: string; type: string; size: number }): { ok: true; tipo: "pdf" | "foto" } | { ok: false; motivo: string } {
  const est = f.name.toLowerCase().split(".").pop() ?? "";
  const pdf = f.type === "application/pdf" || est === "pdf";
  const foto = ["image/jpeg", "image/png", "image/webp"].includes(f.type) || ["jpg", "jpeg", "png", "webp"].includes(est);
  if (!pdf && !foto) return { ok: false, motivo: "Carica un PDF o una foto JPG o PNG" };
  if (f.size > MAX_MB * 1024 * 1024) return { ok: false, motivo: `Il file è troppo grande: massimo ${MAX_MB} MB` };
  return { ok: true, tipo: pdf ? "pdf" : "foto" };
}

export function rimpicciolisciFoto(file: File, lato = 1600): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, lato / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * k);
      canvas.height = Math.round(img.height * k);
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("foto non salvata"))), "image/jpeg", 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("immagine non leggibile"));
    };
    img.src = url;
  });
}

export const documentiDemo: Documento[] = [
  { id: "D1", nome: "Piano alimentare.pdf", tipo: "pdf", da: "nutrizionista", data: "2026-10-05", file: "/prototipo/dieta-esempio.pdf" },
  { id: "D2", nome: "Analisi del sangue.pdf", tipo: "pdf", da: "cliente", data: "2026-10-02", file: "/prototipo/analisi-esempio.pdf" },
];
