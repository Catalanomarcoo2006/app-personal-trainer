import { TrainerApp } from "@/components/prototipo/trainer/TrainerApp";

// Tutta l'area del trainer è una pagina sola: cambiare sezione non passa dal server, quindi è istantaneo.
export default function PrototipoTrainer() {
  return <TrainerApp />;
}
