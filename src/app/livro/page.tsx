"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LivroDetalhesClient from "./LivroDetalhesClient";

export default function LivroSelecionadoPage() {
  const router = useRouter();
  const [livroId, setLivroId] = useState<string | null>(null);

  useEffect(() => {
    const idSalvo = sessionStorage.getItem("livroSelecionadoId");
    if (idSalvo) {
      setLivroId(idSalvo);
      return;
    }
    router.replace("/homecards");
  }, [router]);

  if (!livroId) return <p>Carregando livro...</p>;

  return <LivroDetalhesClient livroIdOverride={livroId} />;
}
