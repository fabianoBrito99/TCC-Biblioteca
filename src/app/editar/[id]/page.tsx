import EditarLivroForm from "@/componentes/editarLivro/EditarLivroForm";

export const dynamic = "force-dynamic"; // opcional

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // <- aguarda o params

  return <EditarLivroForm id={id} />;
}
