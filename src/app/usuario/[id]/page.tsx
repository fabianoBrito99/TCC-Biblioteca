import UsuarioDetalhes from "@/componentes/usuarios/usuarioDetalhes";
import { notFound } from "next/navigation";

type RouteParams = { id: string };

export default async function UsuarioDetalhesPage({
  params,
}: {
  params?: Promise<RouteParams>;
}) {
  const p = (await params) ?? { id: "" };

  if (!p.id) {
    notFound();
  }

  return <UsuarioDetalhes params={p} />;
}
