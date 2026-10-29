import type { MetadataRoute } from "next";

// Nome e icone quando l'app si aggiunge alla schermata Home (Android e iPhone). "Spotter" è il nome provvisorio
// (Marco, 27/10); le icone sono il logo di Leo con l'anello (public/brand/logo-leo-anello.svg), a quadrato pieno:
// gli angoli li arrotonda il telefono.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spotter",
    short_name: "Spotter",
    start_url: "/",
    display: "browser",
    background_color: "#e6f1e8",
    theme_color: "#e6f1e8",
    icons: [
      { src: "/brand/icona-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icona-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
