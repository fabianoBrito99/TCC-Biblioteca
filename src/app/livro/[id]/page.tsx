"use client";

import { useParams } from "next/navigation";
import LivroDetalhesClient from "../LivroDetalhesClient";

export default function DetalhesLivroPage() {
  const { id } = useParams();
  return <LivroDetalhesClient livroIdOverride={String(id ?? "")} />;
}
