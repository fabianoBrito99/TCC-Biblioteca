"use client"
import DetalhesEmprestimo from "@/componentes/emprestimo/detalhesEmprestismo";
import { useParams } from "next/navigation";

export default function DetalheEmprestimoPage() {
  const { id } = useParams();

  if (!id) {
    return <div>Carregando...</div>;
  }

  return (
    <DetalhesEmprestimo idEmprestimo={String(id)} />
  );
}
