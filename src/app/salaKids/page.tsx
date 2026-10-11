import type { Metadata } from "next";
import SalaKidsClient from "./SalaKidsClient";

export const metadata: Metadata = {
  title: "Sala Kids | Painel da cozinha",
  description: "Quantidade de crianças por sala e alertas de restrição alimentar.",
};

export default function SalaKidsPage() {
  return <SalaKidsClient />;
}
