import UsuarioDetalhes from "@/componentes/usuarios/usuarioDetalhes";

export default function UsuarioDetalhesPage({ params }: { params: { id: string } }) {
  return <UsuarioDetalhes params={params} />;
}
