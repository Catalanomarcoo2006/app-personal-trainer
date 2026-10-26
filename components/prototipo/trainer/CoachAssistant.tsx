"use client";

import { KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react";
import { Hand } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { ROUTES } from "./nav";
import { LeoIdentikit } from "./LeoIdentikit";
import { setInfoSeen, setIntroSeen } from "./LeoPresentazione";
import { COACH_NAME, STAND_RATIO, STAND_RIGHT, FLOOR, LEAN_BODY, PANEL_W, PANEL_LEFT_MIN, PULSE, clamp } from "./leo/costanti";
import { Bubble, type Speech, tips, novita } from "./leo/Fumetti";
import { useCoachChat, type Chat } from "./leo/useChatLeo";
import { ChatPanel } from "./leo/ChatPanel";
import { CoachButton } from "./leo/CoachButton";
import { onApriLeo } from "./richieste";

let novitaViste = false;
// Quante vignette della home sono già uscite: tornando sulla home non ricominciano da capo.
const tipCursor = { shown: 0 };

// ——— Leo ———

// Resta montato mentre si cambia pagina (sta nel layout): la conversazione non si perde.
export function CoachAssistant() {
  const home = usePathname() === ROUTES.oggi;
  const chat = useCoachChat();
  // aperta qui: CoachStage si rimonta passando tra la home e le altre pagine, e il viaggio di Leo ci passa
  const [open, setOpen] = useState(false);
  return <CoachStage key={home ? "home" : "pagine"} home={home} chat={chat} open={open} setOpen={setOpen} />;
}

function CoachStage({ home, chat, open, setOpen }: { home: boolean; chat: Chat; open: boolean; setOpen: (open: boolean) => void }) {
  const reduce = useReducedMotion();
  const layer = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1303, h: 640 });

  useLayoutEffect(() => {
    const el = layer.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // In piedi cresce con l'altezza della tela; sulle tele basse la testa sfiora l'ultimo messaggio.
  const standH = Math.round(clamp(size.h - 500, 132, 168));
  const standW = Math.round(standH * STAND_RATIO);
  const standX = size.w - STAND_RIGHT;

  const [unseen, setUnseen] = useState(novitaViste ? 0 : novita.length);

  // Cliccato, Leo lascia l'angolo e si sporge dal bordo destro della chat: sulla home la chat si apre
  // a sinistra dell'angolo, lasciando a Leo lo spazio; nelle altre pagine accanto al tasto.
  const panelLeft = home ? clamp(size.w - 18 - LEAN_BODY - PANEL_W, PANEL_LEFT_MIN, size.w - 18 - PANEL_W) : PANEL_LEFT_MIN;
  const panelOrigin = home ? "100% 100%" : "0% 100%";

  // Ingresso: compare salendo appena da sotto, una volta sola; poi resta fermo.
  const rise = useMotionValue(16);
  const fade = useMotionValue(0);

  // ——— Vignette ———
  const [speech, setSpeech] = useState<(Speech & { id: number }) | null>(null);
  const speechId = useRef(1);
  const speechTimer = useRef<number | undefined>(undefined);

  const say = useCallback((s: Speech | null, ms = 5200) => {
    window.clearTimeout(speechTimer.current);
    setSpeech(s ? { ...s, id: speechId.current++ } : null);
    if (s && ms > 0) speechTimer.current = window.setTimeout(() => setSpeech(null), ms);
  }, []);

  const [tipTick, setTipTick] = useState(0);
  useEffect(() => {
    if (!home || open || tipCursor.shown >= tips.length) return;
    const t = window.setTimeout(
      () => {
        say(tips[tipCursor.shown]);
        tipCursor.shown++;
        setTipTick((n) => n + 1);
      },
      tipCursor.shown === 0 ? 1800 : 7000,
    );
    return () => window.clearTimeout(t);
  }, [home, open, tipTick, say]);

  useEffect(() => () => window.clearTimeout(speechTimer.current), []);

  // Sulla home compare salendo da sotto, dopo le schede.
  useEffect(() => {
    if (!home) return;
    const c = [animate(fade, 1, { duration: 0.3, delay: 0.6 }), animate(rise, 0, reduce ? { duration: 0 } : { type: "spring", duration: 0.6, bounce: 0.25, delay: 0.6 })];
    return () => c.forEach((a) => a.stop());
  }, [home, fade, rise, reduce]);

  // Al primo passaggio del mouse dice che si può cliccare. Al passaggio la figura resta ferma.
  const [hover, setHover] = useState(false);
  const hinted = useRef(false);
  const hint = () => {
    if (hinted.current || speech || open) return;
    hinted.current = true;
    say({ icon: Hand, text: "Toccami per farmi una domanda." }, 3400);
  };

  // ——— Chat ———
  const openChat = (question?: string) => {
    if (open) return;
    playSound("open");
    say(null);
    setOpen(true);
    if (!novitaViste) {
      novitaViste = true;
      setUnseen(0);
    }
    if (question) window.setTimeout(() => chat.ask(question), 380);
  };
  // Azioni rapide della barra in alto: la chat si apre con la frase già scritta, il trainer la completa
  const [bozza, setBozza] = useState<string | undefined>();
  const apriChat = useRef(openChat);
  apriChat.current = openChat;
  useEffect(
    () =>
      onApriLeo((b) => {
        setBozza(b);
        setInfo(false);
        apriChat.current();
      }),
    [],
  );
  // chiusa la chat (X, velo, Esc, link di Leo) la frase non serve più: la prossima volta si riapre vuota
  useEffect(() => {
    if (!open) setBozza(undefined);
  }, [open]);

  const closeChat = () => {
    playSound("close");
    setOpen(false);
    setInfo(false);
  };

  // ——— Identikit: dalla i della chat; si torna alla chat con la X, il tasto o Esc ———
  const [info, setInfo] = useState(false);
  const openInfo = () => {
    playSound("open");
    setInfoSeen();
    setIntroSeen(true); // l'identikit dice già tutto: la presentazione non riparte
    setInfo(true);
  };
  const closeInfo = () => {
    playSound("close");
    setInfo(false);
  };
  const replayIntro = () => {
    setIntroSeen(false);
    closeInfo();
  };

  // Esc chiude l'identikit (si torna alla chat), poi la chat. Non durante il viaggio di Leo: dura pochi secondi
  // e, a chat chiusa, l'app cambierebbe sezione da sola senza dire perché.
  const inViaggio = chat.compatta;
  useEffect(() => {
    if (!open || inViaggio) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (info) setInfo(false);
      else setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, info, inViaggio]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openChat();
    }
  };


  return (
    <>
      {/* il velo sotto la chat */}
      <AnimatePresence>
        {open && !chat.compatta && (
          <motion.button
            key="velo"
            type="button"
            aria-label="Chiudi l'assistente"
            onClick={closeChat}
            className="absolute inset-0 z-[45] bg-black/10 backdrop-blur-[4px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && !info && <ChatPanel key="chat" left={panelLeft} origin={panelOrigin} height={size.h} chat={chat} close={closeChat} dismiss={() => setOpen(false)} openInfo={openInfo} bozza={bozza} />}
      </AnimatePresence>
      <AnimatePresence>{open && info && <LeoIdentikit key="identikit" onBack={closeInfo} onReplayIntro={replayIntro} />}</AnimatePresence>

      {!home && <CoachButton hidden={open} count={unseen} onOpen={() => openChat()} />}

      <div ref={layer} className="pointer-events-none absolute inset-0 z-[46]">
        {home && (
          <motion.div className="absolute left-0" style={{ x: standX, bottom: FLOOR, opacity: fade }}>
            {/* a chat aperta lascia l'angolo: ricompare aggrappato al bordo della chat */}
            <motion.div
              initial={false}
              animate={open ? { opacity: 0, scale: 0.9, x: -24 } : { opacity: 1, scale: 1, x: 0 }}
              transition={open ? { duration: 0.18, ease: EASE_OUT } : { type: "spring", duration: 0.45, bounce: 0.2, delay: 0.1 }}
              style={{ originY: 1 }}
              className={open ? "pointer-events-none" : ""}
            >
              <motion.div style={{ y: rise }}>
                {/* alone nel colore del trainer dietro il busto: respira piano per attirare lo sguardo */}
                <motion.span
                  aria-hidden
                  className="leo-alone pointer-events-none absolute rounded-full"
                  style={{ width: standW * 2, height: standH * 0.95, left: -standW, bottom: standH * 0.12 }}
                  animate={reduce ? { opacity: 0.8 } : { opacity: [0.6, 1, 0.6], scale: [0.95, 1.04, 0.95] }}
                  transition={reduce ? { duration: 0 } : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* ombra a terra */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute rounded-[50%] bg-black/20 blur-[4px] dark:bg-black/50"
                  style={{ width: standW * 0.95, height: 9, left: (-standW * 0.95) / 2, bottom: -4 }}
                />
                {/* onde sul pavimento, insieme al contorno: "toccami" */}
                {!reduce &&
                  [0, 0.35].map((d) => (
                    <motion.span
                      key={d}
                      aria-hidden
                      className="leo-onda pointer-events-none absolute rounded-[50%]"
                      style={{ width: standW * 1.1, height: standW * 0.3, left: (-standW * 1.1) / 2, bottom: (-standW * 0.3) / 2 + 2 }}
                      initial={{ opacity: 0, scale: 0.45 }}
                      animate={{ opacity: [0, 0.9, 0], scale: [0.45, 1, 1.45] }}
                      transition={{ duration: PULSE.duration, repeat: Infinity, repeatDelay: PULSE.pause, delay: PULSE.first + d, ease: "easeOut", times: [0, 0.25, 1] }}
                    />
                  ))}
                {/* contorno luminoso che si accende a intervalli (fisso al passaggio del mouse) */}
                <motion.img
                  src="/prototipo/coach/in-piedi.webp"
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="leo-contorno pointer-events-none absolute bottom-0 max-w-none select-none"
                  style={{ width: standW, left: -standW / 2 }}
                  initial={{ opacity: 0 }}
                  animate={hover ? { opacity: 1 } : reduce ? { opacity: 0.45 } : { opacity: [0, 1, 0] }}
                  transition={
                    hover || reduce
                      ? { duration: 0.2 }
                      : { duration: PULSE.duration, repeat: Infinity, repeatDelay: PULSE.pause, delay: PULSE.first, ease: "easeInOut" }
                  }
                />
                <img
                  src="/prototipo/coach/in-piedi.webp"
                  alt=""
                  draggable={false}
                  className="leo-luce absolute bottom-0 max-w-none select-none"
                  style={{ width: standW, left: -standW / 2 }}
                />
                {/* zona cliccabile: segue la sagoma, così gli angoli vuoti non coprono i messaggi */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`${COACH_NAME}, il tuo assistente. Clicca o premi Invio per fargli una domanda.`}
                  onClick={() => openChat()}
                  onKeyDown={onKeyDown}
                  onMouseEnter={() => {
                    setHover(true);
                    hint();
                  }}
                  onMouseLeave={() => setHover(false)}
                  className="pointer-events-auto absolute bottom-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--trainer)]"
                  style={{
                    width: standW,
                    height: standH,
                    left: -standW / 2,
                    // sagoma: testa, mano che saluta a sinistra, tablet a destra, gambe
                    clipPath: "polygon(40% 0%, 76% 0%, 78% 20%, 95% 24%, 100% 46%, 100% 62%, 88% 64%, 90% 100%, 25% 100%, 30% 52%, 22% 42%, 0% 38%, 0% 25%, 15% 24%, 38% 20%)",
                  }}
                />
              </motion.div>

              {/* vignetta: a sinistra della testa, accanto al petto */}
              <div className="absolute w-max translate-y-full" style={{ bottom: standH * 0.68, right: standW * 0.16 }}>
                <AnimatePresence mode="wait">
                  {speech && !open && <Bubble key={speech.id} speech={speech} place="head-left" onAsk={(q) => openChat(q)} />}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </>
  );
}
