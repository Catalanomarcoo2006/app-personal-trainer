import { ConfigProps } from "./types/config";

const config = {
  appName: "APP PERSONAL TRAINER", // nome di lavoro, da sostituire con il nome commerciale
  // descrizione per i motori di ricerca (si può sostituire pagina per pagina)
  appDescription:
    "L'app del personal trainer: clienti, schede, calendario e pagamenti, con il marchio del trainer e un assistente virtuale.",
  // solo il dominio, senza https:// né / finale: oggi l'indirizzo di Vercel, poi il dominio del prodotto
  domainName: "app-personal-trainer-kappa.vercel.app",
  resend: {
    // Mittenti delle email (Fase 5). onboarding@resend.dev è il mittente di prova di Resend:
    // va sostituito con un indirizzo del dominio del prodotto, verificato su Resend.
    fromNoReply: `APP PERSONAL TRAINER <onboarding@resend.dev>`,
    fromAdmin: `APP PERSONAL TRAINER <onboarding@resend.dev>`,
    // email di supporto mostrata nel piè di pagina: vuota finché Marco non ne sceglie una
    supportEmail: undefined,
  },
  colors: {
    // tema DaisyUI della pagina
    theme: "light",
    // colore della barra di caricamento e della barra del browser: quello di default del trainer
    main: "#FF6B2C",
  },
  auth: {
    // pagina di accesso (usata per proteggere /dashboard e dopo un 401 dalle API)
    loginUrl: "/signin",
    // dove si arriva dopo l'accesso
    callbackUrl: "/dashboard",
  },
} as ConfigProps;

export default config;
