"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./sugestoes.module.css";

type FotoCapaRaw =
  | { type: "Buffer"; data: number[] }   // comum quando vem de MySQL Buffer serializado
  | { data: number[] };                  // variação sem "type"

interface Livro {
  id_livro: number;
  nome_livro: string;
  nome_autor: string;
  foto_capa?: string | FotoCapaRaw | null; // string (URL/base64) ou bytes
}

interface ApiResp {
  livros: Livro[];
}

interface Props {
  categoria: string;
}

export default function SugestoesLivros({ categoria }: Props) {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const livrosPorPagina = 20;
  const router = useRouter();

  useEffect(() => {
    async function fetchLivros() {
      try {
        const response = await fetch(
          `https://api.helenaramazzotte.online/livro/categoria/${encodeURIComponent(
            categoria
          )}`
        );
        if (!response.ok) throw new Error("Erro ao buscar livros.");
        const data: ApiResp = await response.json();
        setLivros(data.livros ?? []);
      } catch (error) {
        console.error(error);
      }
    }

    if (categoria) {
      fetchLivros();
    }
  }, [categoria]);

  // Converte array de bytes em dataURL base64 (sem usar Buffer do Node)
  const bytesToDataUrlJPEG = (bytes: number[]): string => {
    let binary = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const slice = bytes.slice(i, i + CHUNK);
      binary += String.fromCharCode(...slice);
    }
    return `data:image/jpeg;base64,${btoa(binary)}`;
  };

  // Normaliza a imagem para uma URL (dataURL ou placeholder)
  const getImagemUrl = (
    fotoCapa: string | FotoCapaRaw | null | undefined
  ): string => {
    if (!fotoCapa) return "/img/default-book.png";
    if (typeof fotoCapa === "string") {
      // já é URL ou dataURL base64
      return fotoCapa.trim() !== "" ? fotoCapa : "/img/default-book.png";
    }
    const data = (fotoCapa as FotoCapaRaw).data;
    if (Array.isArray(data) && data.length > 0) {
      return bytesToDataUrlJPEG(data);
    }
    return "/img/default-book.png";
  };

  // Paginação
  const totalPaginas = Math.ceil(livros.length / livrosPorPagina);
  const livrosExibidos = livros.slice(
    (paginaAtual - 1) * livrosPorPagina,
    paginaAtual * livrosPorPagina
  );

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {livrosExibidos.map((livro) => {
          const imgUrl = getImagemUrl(livro.foto_capa);
          return (
            <div
              key={livro.id_livro}
              className={styles.cardLivro}
              onClick={() => router.push(`/livro/${livro.id_livro}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/livro/${livro.id_livro}`);
              }}
            >
              <Image
                src={imgUrl}
                alt={livro.nome_livro}
                width={150}
                height={220}
                className={styles.image}
              />
              <h3>{livro.nome_livro}</h3>
              <p>{livro.nome_autor}</p>
            </div>
          );
        })}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
            disabled={paginaAtual === 1}
          >
            ⬅️ Anterior
          </button>
          <span>
            {" "}
            Página {paginaAtual} de {totalPaginas}{" "}
          </span>
          <button
            onClick={() =>
              setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
            }
            disabled={paginaAtual === totalPaginas}
          >
            Próxima ➡️
          </button>
        </div>
      )}
    </div>
  );
}
