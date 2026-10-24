"use client";

import { MouseEvent as ReactMouseEvent, ReactNode, useState } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, ImagePlus, Palette, UserRound } from "lucide-react";
import { ACCENTS, useAppearance } from "@/components/ui/appearance";
import { EASE_OUT } from "@/components/ui/motion";
import { conMacchia } from "@/libs/ui/macchia";
import { playSound } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";
import { aggiornaBenvenuto, controllaLogo, inizialiStudio, nomeDelTrainer, MAX_SPECIALITA, misuraLogo, scegliSpecialita, SPECIALITA, useBenvenuto } from "@/libs/prototipo/benvenuto";
import { shrinkPhoto, stato, useStato, useTrainerPhoto } from "@/libs/prototipo/stato";
import type { PropsPasso } from "../Benvenuto";
import { CLASSE_CAMPO, Campo, Entra, Tasto, TastoTesto, TestaPasso } from "../ui";

// Passo 2 del benvenuto: il marchio che vedranno i clienti (nome dello studio, logo, foto, colore).
// Ogni scelta si salva subito e accende un pezzo del telefono nella vetrina (AnteprimaTelefono).

// Logo raster: lato lungo al massimo 512 px, PNG per tenere la trasparenza. SVG: tenuto così com'è.
export function rimpicciolisciLogo(file: File, vettoriale: boolean): Promise<string> {
  if (vettoriale) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("logo non leggibile"));
      r.readAsDataURL(file);
    });
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const { w, h } = misuraLogo(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("logo non leggibile"));
    };
    img.src = url;
  });
}

export function Marchio({ avanti }: PropsPasso) {
  const b = useBenvenuto();
  const { accent, setAccent } = useAppearance();
  const foto = useTrainerPhoto();
  const fotoScelta = useStato((s) => s.trainerPhoto) !== null;
  const [erroreLogo, setErroreLogo] = useState<string | null>(null);
  const [erroreFoto, setErroreFoto] = useState<string | null>(null);

  const caricaLogo = async (file: File | undefined) => {
    if (!file) return;
    const esito = controllaLogo(file);
    if ("motivo" in esito) {
      setErroreLogo(esito.motivo);
      return;
    }
    try {
      aggiornaBenvenuto({ logo: await rimpicciolisciLogo(file, esito.vettoriale) });
      setErroreLogo(null);
      playSound("tap");
    } catch {
      setErroreLogo("Non riesco a leggere questo file: prova con un altro");
    }
  };

  const caricaFoto = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErroreFoto("Scegli una foto (JPG, PNG o WebP)");
      return;
    }
    try {
      stato.setTrainerPhoto(await shrinkPhoto(file));
      setErroreFoto(null);
      playSound("tap");
    } catch {
      setErroreFoto("Non riesco a leggere questa foto: prova con un'altra");
    }
  };

  // Il nuovo colore si allarga a macchia d'olio dal pallino toccato, su tutta la pagina (vetrina e telefono compresi).
  const scegliColore = (c: string, e: ReactMouseEvent) => {
    playSound("tap");
    if (c === accent && b.coloreScelto) return;
    conMacchia(
      () =>
        flushSync(() => {
          setAccent(c);
          aggiornaBenvenuto({ coloreScelto: true });
        }),
      { x: e.clientX, y: e.clientY },
    );
  };

  return (
    <div>
      <TestaPasso icona={Palette} titolo="Il tuo marchio" sotto="L'app dei tuoi clienti avrà il tuo nome, il tuo logo e il tuo colore. Guardala nascere qui a fianco." />
      <div className="mt-[20px] flex flex-col gap-[14px]">
        <Entra i={3}>
          <div className="grid grid-cols-2 gap-x-[10px] gap-y-[12px]">
            {/* già compilato con il nome dell'account (lo crea Marco); se si svuota, resta quello */}
            <Campo etichetta="Il tuo nome">
              <input
                value={b.nome ?? trainer.name}
                onChange={(e) => aggiornaBenvenuto({ nome: e.target.value })}
                placeholder={trainer.name}
                maxLength={40}
                autoComplete="name"
                className={CLASSE_CAMPO}
              />
            </Campo>
            <Campo etichetta="Nome dello studio">
              <input
                value={b.studio}
                onChange={(e) => aggiornaBenvenuto({ studio: e.target.value })}
                placeholder="Es. Officina Fitness"
                maxLength={40}
                autoComplete="organization"
                className={CLASSE_CAMPO}
              />
            </Campo>
            <div className="col-span-2">
              <Campo etichetta="Motto" destra={<span className="text-[11px] font-normal text-muted">facoltativo</span>}>
                <input
                  value={b.motto}
                  onChange={(e) => aggiornaBenvenuto({ motto: e.target.value })}
                  placeholder="Allenati con metodo"
                  maxLength={60}
                  className={CLASSE_CAMPO}
                />
              </Campo>
            </div>
          </div>
        </Entra>

        <Entra i={5}>
          <div className="grid grid-cols-2 gap-[12px]">
            <Carica
              etichetta="Logo"
              aiuto="PNG, JPG o SVG"
              accetta="image/png,image/jpeg,image/webp,image/svg+xml"
              onFile={caricaLogo}
              onTogli={b.logo ? () => aggiornaBenvenuto({ logo: null }) : undefined}
              anteprima={
                b.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logo} alt="Il tuo logo" className="size-full rounded-[14px] border border-line bg-white object-contain p-[5px]" />
                ) : (
                  <span className="grid size-full place-items-center rounded-[14px] text-[15px] font-extrabold text-white transition-colors duration-500" style={{ background: "var(--trainer)" }}>
                    {inizialiStudio(b.studio, nomeDelTrainer(b.nome, trainer.name))}
                  </span>
                )
              }
              vuoto={!b.logo}
              icona={<ImagePlus size={14} />}
            />
            <Carica
              etichetta="La tua foto"
              aiuto="La vedono i clienti"
              accetta="image/*"
              tonda
              onFile={caricaFoto}
              onTogli={fotoScelta ? () => stato.setTrainerPhoto(null) : undefined}
              anteprima={
                fotoScelta ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto} alt="La tua foto" className="size-full rounded-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center rounded-full bg-soft text-muted">
                    <UserRound size={20} />
                  </span>
                )
              }
              vuoto={!fotoScelta}
              icona={<ImagePlus size={14} />}
            />
          </div>
          <AnimatePresence>
            {(erroreLogo || erroreFoto) && (
              <motion.p
                role="alert"
                className="mt-[8px] text-[12.5px] font-semibold text-[#d93d3d]"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
              >
                {erroreLogo ?? erroreFoto}
              </motion.p>
            )}
          </AnimatePresence>
        </Entra>

        <Entra i={6}>
          <p className="flex items-center justify-between text-[12.5px] font-semibold">
            Le tue specialità
            <span className="text-[11.5px] font-normal text-muted">fino a {MAX_SPECIALITA}</span>
          </p>
          <div className="mt-[7px] flex flex-wrap gap-[5px]">
            {SPECIALITA.map((sp) => {
              const scelta = b.specialita.includes(sp);
              const piena = !scelta && b.specialita.length >= MAX_SPECIALITA;
              return (
                <motion.button
                  key={sp}
                  type="button"
                  aria-pressed={scelta}
                  disabled={piena}
                  whileTap={piena ? undefined : { scale: 0.94 }}
                  onClick={() => {
                    playSound("tap");
                    aggiornaBenvenuto({ specialita: scegliSpecialita(b.specialita, sp) });
                  }}
                  className={`flex h-[30px] items-center gap-[5px] rounded-full border px-[10px] text-[11.5px] font-semibold transition-[background-color,border-color,color,opacity] duration-200 ${
                    scelta ? "cursor-pointer border-transparent" : piena ? "cursor-not-allowed border-line opacity-45" : "cursor-pointer border-line hover:border-ink/25"
                  }`}
                  style={scelta ? { background: "color-mix(in srgb, var(--trainer) 14%, var(--color-card))", color: "var(--trainer)" } : undefined}
                >
                  {scelta && <Check size={12} strokeWidth={3} />}
                  {sp}
                </motion.button>
              );
            })}
          </div>
        </Entra>

        <Entra i={7}>
          <p className="text-[12.5px] font-semibold">Il tuo colore</p>
          <div className="mt-[8px] flex flex-wrap gap-[10px]" role="radiogroup" aria-label="Il tuo colore">
            {ACCENTS.map((c) => {
              const scelto = b.coloreScelto && accent === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={scelto}
                  aria-label={`Colore ${c}`}
                  onClick={(e) => scegliColore(c, e)}
                  className="relative grid size-[34px] cursor-pointer place-items-center rounded-full transition-transform [@media(hover:hover)]:hover:scale-110"
                  style={{ background: c }}
                >
                  {scelto && (
                    <motion.span layoutId="marchio-colore" className="absolute inset-[-5px] rounded-full border-2" style={{ borderColor: c }} transition={{ type: "spring", stiffness: 420, damping: 30 }} />
                  )}
                  {scelto && <Check size={15} className="text-white" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </Entra>

        <Entra i={8}>
          <div className="mt-[4px] flex flex-col items-center gap-[4px]">
            <Tasto
              onClick={() => {
                playSound("confirm");
                avanti();
              }}
            >
              Avanti
            </Tasto>
            <TastoTesto onClick={avanti}>Lo faccio dopo</TastoTesto>
          </div>
        </Entra>
      </div>
    </div>
  );
}

// Riquadro per caricare un'immagine: anteprima, nome, "Carica" (o "Cambia") e "Togli".
function Carica({
  etichetta,
  aiuto,
  accetta,
  tonda,
  vuoto,
  anteprima,
  icona,
  onFile,
  onTogli,
}: {
  etichetta: string;
  aiuto: string;
  accetta: string;
  tonda?: boolean;
  vuoto: boolean;
  anteprima: ReactNode;
  icona: ReactNode;
  onFile: (f: File | undefined) => void;
  onTogli?: () => void;
}) {
  return (
    <div className="flex items-center gap-[11px] rounded-[14px] border border-line p-[10px]">
      <label
        className={`relative size-[52px] shrink-0 cursor-pointer ${tonda ? "rounded-full" : "rounded-[14px]"} ${vuoto ? "outline-dashed outline-[1.5px] outline-offset-[3px] outline-line" : ""}`}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={vuoto ? "vuoto" : "pieno"}
            className="block size-full"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 480, damping: 22 }}
          >
            {anteprima}
          </motion.span>
        </AnimatePresence>
        <input
          type="file"
          accept={accetta}
          className="sr-only"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = ""; // si può ricaricare lo stesso file
          }}
        />
      </label>
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold leading-[1.2]">{etichetta}</p>
        <p className="truncate text-[11px] text-muted">{aiuto}</p>
        <div className="mt-[3px] flex items-center gap-[10px] text-[12px] font-semibold">
          <label className="flex min-h-[28px] cursor-pointer items-center gap-[4px] text-[var(--trainer)] hover:underline">
            {icona}
            {vuoto ? "Carica" : "Cambia"}
            <input
              type="file"
              accept={accetta}
              className="sr-only"
              onChange={(e) => {
                onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {onTogli && (
            <button type="button" onClick={onTogli} className="min-h-[28px] cursor-pointer text-muted hover:text-ink">
              Togli
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
