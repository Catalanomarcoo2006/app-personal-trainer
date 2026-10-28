import { ClientApp } from "@/components/prototipo/cliente/ClientApp";

// Tutta l'app del cliente è una pagina sola, come l'area trainer: cambiare sezione non passa dal server.
export default function PrototipoCliente() {
  return <ClientApp />;
}
